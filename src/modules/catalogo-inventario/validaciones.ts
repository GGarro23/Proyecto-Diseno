import { entero, espacios, monto, rutaImagen, texto, type Mensaje } from "@/lib/validacion";
import { cambioEnExistencias } from "./reglas";
import type { Categoria, Producto, TipoMovimiento } from "./schema";

export const SIMBOLOS = ["♪", "♩", "♫", "♬", "♯", "♭", "♮", "𝄞"] as const;

export const LIMITES_CATALOGO = {
  nombreCategoria: 40,
  descripcionCategoria: 60,
  codigo: 30,
  nombreProducto: 120,
  descripcionProducto: 1000,
  precioMaximo: 50_000_000,
  existenciasMaximas: 100_000,
  cantidadMovimiento: 10_000,
  motivo: 300,
};

export const CODIGO_PRODUCTO = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;

const NOMBRE_CATEGORIA = /^[\p{L}][\p{L}\s&,-]*$/u;

export const comparable = (valor: string) =>
  valor.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().replace(/\s+/g, " ").toLowerCase();

export type DatosCategoria = { nombre: string; descripcion: string; simbolo: string };

export type ErroresCategoria = Partial<Record<keyof DatosCategoria, string>>;

export function validarCategoria(datos: DatosCategoria, categorias: Categoria[], idCategoria?: number): ErroresCategoria {
  const errores: ErroresCategoria = {};
  const nombre = espacios(datos.nombre);
  const errorNombre = texto(nombre, "el nombre de la categoría", {
    min: 3,
    max: LIMITES_CATALOGO.nombreCategoria,
    patron: NOMBRE_CATEGORIA,
    mensajePatron: "El nombre solo puede tener letras, espacios, comas, guiones y &.",
  });
  if (errorNombre) errores.nombre = errorNombre;
  else if (categorias.some((c) => c.idCategoria !== idCategoria && comparable(c.nombre) === comparable(nombre))) {
    errores.nombre = "Ya existe una categoría con ese nombre.";
  }
  const errorDescripcion = texto(espacios(datos.descripcion), "la descripción", {
    min: 5,
    max: LIMITES_CATALOGO.descripcionCategoria,
  });
  if (errorDescripcion) errores.descripcion = errorDescripcion;
  if (!SIMBOLOS.includes(datos.simbolo as (typeof SIMBOLOS)[number])) errores.simbolo = "Selecciona un símbolo de la lista.";
  return errores;
}

export function validarCodigo(codigo: string): Mensaje {
  return texto(codigo, "el código del producto", {
    min: 2,
    max: LIMITES_CATALOGO.codigo,
    patron: CODIGO_PRODUCTO,
    mensajePatron: "El código solo puede tener letras sin tildes, números y guiones entre ellos (por ejemplo GUIT-CLAS-01).",
  });
}

export function validarNombreProducto(nombre: string): Mensaje {
  return texto(espacios(nombre), "el nombre del producto", { min: 3, max: LIMITES_CATALOGO.nombreProducto });
}

export function validarPrecio(precio: string): Mensaje {
  return monto(precio, "el precio", 1, LIMITES_CATALOGO.precioMaximo);
}

export function validarExistencias(existencias: string): Mensaje {
  return entero(existencias, "las existencias", 0, LIMITES_CATALOGO.existenciasMaximas);
}

export function validarDescripcionProducto(descripcion: string, requerida: boolean): Mensaje {
  return texto(descripcion, "la descripción del producto", {
    min: 10,
    max: LIMITES_CATALOGO.descripcionProducto,
    requerido: requerida,
  });
}

export type DatosProducto = {
  codigo: string;
  nombre: string;
  idCategoria: string;
  precio: string;
  descripcion: string;
  imagenUrl: string;
};

export type ErroresProducto = Partial<Record<keyof DatosProducto, string>>;

export function validarProducto(
  datos: DatosProducto,
  productos: Producto[],
  categorias: Categoria[],
  idProducto?: number
): ErroresProducto {
  const errores: ErroresProducto = {};
  const errorCodigo = validarCodigo(datos.codigo);
  if (errorCodigo) errores.codigo = errorCodigo;
  else if (productos.some((p) => p.idProducto !== idProducto && comparable(p.codigo) === comparable(datos.codigo))) {
    errores.codigo = "Ya existe un producto con ese código.";
  }
  const errorNombre = validarNombreProducto(datos.nombre);
  if (errorNombre) errores.nombre = errorNombre;
  if (!categorias.some((c) => String(c.idCategoria) === datos.idCategoria)) errores.idCategoria = "Selecciona una categoría existente.";
  const errorPrecio = validarPrecio(datos.precio);
  if (errorPrecio) errores.precio = errorPrecio;
  const errorDescripcion = validarDescripcionProducto(datos.descripcion, true);
  if (errorDescripcion) errores.descripcion = errorDescripcion;
  const errorImagen = rutaImagen(datos.imagenUrl);
  if (errorImagen) errores.imagenUrl = errorImagen;
  return errores;
}

export function validarCantidad(cantidad: string): Mensaje {
  return entero(cantidad, "la cantidad", 1, LIMITES_CATALOGO.cantidadMovimiento);
}

export function validarMotivo(motivo: string, requerido: boolean): Mensaje {
  return texto(espacios(motivo), "el motivo", { min: 5, max: LIMITES_CATALOGO.motivo, requerido });
}

export function validarAjuste(
  existencias: number,
  tipo: Extract<TipoMovimiento, "Ajuste positivo" | "Ajuste negativo">,
  cantidad: string,
  motivo: string
): { cantidad?: string; motivo?: string } {
  const errores: { cantidad?: string; motivo?: string } = {};
  const errorCantidad = validarCantidad(cantidad);
  if (errorCantidad) errores.cantidad = errorCantidad;
  else if (existencias + cambioEnExistencias(tipo, Number(cantidad)) < 0) {
    errores.cantidad = `La disminución no puede ser mayor que las existencias actuales (${existencias}).`;
  } else if (existencias + cambioEnExistencias(tipo, Number(cantidad)) > LIMITES_CATALOGO.existenciasMaximas) {
    errores.cantidad = `Las existencias no pueden superar ${LIMITES_CATALOGO.existenciasMaximas.toLocaleString("es-CR")} unidades.`;
  }
  const errorMotivo = validarMotivo(motivo, true);
  if (errorMotivo) errores.motivo = errorMotivo;
  return errores;
}
