import { rutaImagen } from "@/lib/validacion";
import type { Categoria, Producto } from "@/modules/catalogo-inventario/schema";
import {
  LIMITES_CATALOGO,
  validarCodigo,
  validarDescripcionProducto,
  validarNombreProducto,
} from "@/modules/catalogo-inventario/validaciones";
import type { EjecucionETL, ErrorETL } from "./schema";

export const COLUMNAS_OBLIGATORIAS = ["código", "nombre", "categoría", "precio", "existencias"] as const;
export const COLUMNAS_OPCIONALES = ["descripción", "imagen"] as const;
type Columna = (typeof COLUMNAS_OBLIGATORIAS)[number] | (typeof COLUMNAS_OPCIONALES)[number];

export type ErrorFila = Omit<ErrorETL, "idError" | "idEjecucion">;

export const MAXIMO_FILAS = 5000;

export type FilaValida = {
  numeroFila: number;
  codigo: string;
  nombre: string;
  idCategoria: number;
  precio: number;
  existencias: number;
  descripcion: string;
  imagenUrl: string;
};

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function leerCsv(texto: string): string[][] {
  const limpio = texto.replace(/^\uFEFF/, "");
  const primera = limpio.split(/\r?\n/, 1)[0];
  const separador = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entreComillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') entreComillas = false;
      else celda += c;
    } else if (c === '"') entreComillas = true;
    else if (c === separador) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else celda += c;
  }
  if (celda || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

export function interpretarPrecio(valor: string): number {
  let v = valor.replace(/\s|₡/g, "");
  const coma = v.lastIndexOf(",");
  const punto = v.lastIndexOf(".");
  if (coma >= 0 && punto >= 0) v = coma > punto ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
  else if (coma >= 0) v = v.replace(",", ".");
  return v && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : NaN;
}

export type Analisis =
  | { estructuraValida: false; errores: ErrorFila[] }
  | { estructuraValida: true; validas: FilaValida[]; errores: ErrorFila[]; filasRechazadas: number };

export function analizarCsv(texto: string, productos: Producto[], categorias: Categoria[]): Analisis {
  const filas = leerCsv(texto);
  const encabezado = (filas[0] ?? []).map(normalizar);
  const posicion = (columna: Columna) => encabezado.indexOf(normalizar(columna));

  const faltantes = COLUMNAS_OBLIGATORIAS.filter((c) => posicion(c) === -1);
  if (faltantes.length > 0) {
    return {
      estructuraValida: false,
      errores: [{ numeroFila: null, campo: null, motivo: `Faltan columnas obligatorias: ${faltantes.join(", ")}.` }],
    };
  }
  const datos = filas.slice(1).map((celdas, i) => ({ numeroFila: i + 2, celdas })).filter((f) => f.celdas.some((c) => c.trim()));
  if (datos.length === 0) {
    return { estructuraValida: false, errores: [{ numeroFila: null, campo: null, motivo: "El archivo no tiene filas de productos." }] };
  }
  if (datos.length > MAXIMO_FILAS) {
    return {
      estructuraValida: false,
      errores: [{ numeroFila: null, campo: null, motivo: `El archivo tiene ${datos.length} filas; el máximo por carga es ${MAXIMO_FILAS}.` }],
    };
  }
  const repetidas = encabezado.filter((columna, i) => columna && encabezado.indexOf(columna) !== i);
  if (repetidas.length > 0) {
    return {
      estructuraValida: false,
      errores: [{ numeroFila: null, campo: null, motivo: `Hay columnas repetidas en el encabezado: ${[...new Set(repetidas)].join(", ")}.` }],
    };
  }

  const codigosExistentes = new Set(productos.map((p) => normalizar(p.codigo)));
  const codigosDelArchivo = new Set<string>();
  const validas: FilaValida[] = [];
  const errores: ErrorFila[] = [];
  let filasRechazadas = 0;

  for (const { numeroFila, celdas } of datos) {
    const valor = (columna: Columna) => {
      const i = posicion(columna);
      return i === -1 ? "" : (celdas[i] ?? "").trim();
    };
    const erroresFila: ErrorFila[] = [];
    const error = (campo: string, motivo: string) => erroresFila.push({ numeroFila, campo, motivo });

    const codigo = valor("código");
    const errorCodigo = validarCodigo(codigo);
    if (errorCodigo) error("código", errorCodigo);
    else if (codigosExistentes.has(normalizar(codigo))) error("código", `El código ${codigo} ya está registrado.`);
    else if (codigosDelArchivo.has(normalizar(codigo))) error("código", `El código ${codigo} está repetido en el archivo.`);

    const nombre = valor("nombre").replace(/\s+/g, " ");
    const errorNombre = validarNombreProducto(nombre);
    if (errorNombre) error("nombre", errorNombre);

    const categoria = categorias.find((c) => normalizar(c.nombre) === normalizar(valor("categoría")));
    if (!valor("categoría")) error("categoría", "La categoría está vacía.");
    else if (!categoria) error("categoría", `La categoría "${valor("categoría")}" no existe.`);

    const precio = interpretarPrecio(valor("precio"));
    if (!valor("precio")) error("precio", "El precio está vacío.");
    else if (!(precio > 0)) error("precio", `El precio "${valor("precio")}" no es un número positivo.`);
    else if (Math.round(precio * 100) !== precio * 100) error("precio", `El precio "${valor("precio")}" tiene más de dos decimales.`);
    else if (precio > LIMITES_CATALOGO.precioMaximo) {
      error("precio", `El precio no puede superar ₡${LIMITES_CATALOGO.precioMaximo.toLocaleString("es-CR")}.`);
    }

    const existencias = Number(valor("existencias"));
    if (!/^\d+$/.test(valor("existencias")) || !Number.isInteger(existencias)) {
      error("existencias", `Las existencias "${valor("existencias")}" no son un entero mayor o igual a cero.`);
    } else if (existencias > LIMITES_CATALOGO.existenciasMaximas) {
      error("existencias", `Las existencias no pueden superar ${LIMITES_CATALOGO.existenciasMaximas.toLocaleString("es-CR")} unidades.`);
    }

    const errorDescripcion = validarDescripcionProducto(valor("descripción"), false);
    if (errorDescripcion) error("descripción", errorDescripcion);

    const errorImagen = rutaImagen(valor("imagen"));
    if (errorImagen) error("imagen", errorImagen);

    if (codigo) codigosDelArchivo.add(normalizar(codigo));
    if (erroresFila.length > 0) {
      filasRechazadas++;
      errores.push(...erroresFila);
    } else {
      validas.push({
        numeroFila,
        codigo,
        nombre,
        idCategoria: categoria!.idCategoria,
        precio,
        existencias,
        descripcion: valor("descripción"),
        imagenUrl: valor("imagen"),
      });
    }
  }
  return { estructuraValida: true, validas, errores, filasRechazadas };
}

export function estadoEjecucion(filasAceptadas: number, filasRechazadas: number): EjecucionETL["estado"] {
  if (filasAceptadas === 0) return "Fallida";
  return filasRechazadas === 0 ? "Exitosa" : "Parcialmente Exitosa";
}

export const PLANTILLA_CSV = "\uFEFF" + [...COLUMNAS_OBLIGATORIAS, ...COLUMNAS_OPCIONALES].join(",") + "\r\n";