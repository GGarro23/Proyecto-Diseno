import { consulta } from "@/lib/db";
import { ErrorApi, exito, leerCuerpo, leerId, manejar } from "@/lib/respuesta";
import { aTexto, espacios } from "@/lib/validacion";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";
import { obtenerCategorias } from "@/modules/catalogo-inventario/consultas";
import { validarCategoria, type DatosCategoria } from "@/modules/catalogo-inventario/validaciones";

type CuerpoCategoria = { idCategoria?: unknown; nombre?: unknown; descripcion?: unknown; simbolo?: unknown };

type CategoriaConTotal = {
  idCategoria: number;
  nombre: string;
  descripcion: string;
  simbolo: string;
  totalProductos: number;
};

const COLUMNAS = `
  id_categoria AS "idCategoria",
  nombre,
  COALESCE(descripcion, '') AS descripcion,
  simbolo`;

function leerDatos(cuerpo: CuerpoCategoria): DatosCategoria {
  return {
    nombre: espacios(aTexto(cuerpo.nombre)),
    descripcion: espacios(aTexto(cuerpo.descripcion)),
    simbolo: aTexto(cuerpo.simbolo),
  };
}

async function comprobar(datos: DatosCategoria, idCategoria?: number) {
  const categorias = await obtenerCategorias();
  if (idCategoria !== undefined && !categorias.some((c) => c.idCategoria === idCategoria)) {
    throw new ErrorApi(404, "La categoría no existe.");
  }
  const errores = validarCategoria(datos, categorias, idCategoria);
  if (Object.keys(errores).length > 0) {
    const duplicado = errores.nombre === "Ya existe una categoría con ese nombre.";
    throw new ErrorApi(duplicado ? 409 : 400, duplicado ? errores.nombre! : "Revisa los datos marcados.", errores);
  }
}

function errorBaseDatos(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "23505") {
      throw new ErrorApi(409, "Ya existe una categoría con ese nombre.", { nombre: "Ya existe una categoría con ese nombre." });
    }
    if (error.code === "23514" || error.code === "22001") {
      throw new ErrorApi(400, "Los datos de la categoría no cumplen las reglas permitidas.");
    }
  }
  throw error;
}

export function GET() {
  return manejar(async () => {
    const categorias = await consulta<CategoriaConTotal>(`
      SELECT
        c.id_categoria AS "idCategoria",
        c.nombre,
        COALESCE(c.descripcion, '') AS descripcion,
        c.simbolo,
        COUNT(p.id_producto)::integer AS "totalProductos"
      FROM categoria c
      LEFT JOIN producto p ON p.id_categoria = c.id_categoria
      GROUP BY c.id_categoria
      ORDER BY c.nombre
    `);
    return exito(categorias);
  });
}

export function POST(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");
    const datos = leerDatos(await leerCuerpo<CuerpoCategoria>(peticion));
    await comprobar(datos);
    try {
      const filas = await consulta<CategoriaConTotal>(
        `INSERT INTO categoria (nombre, descripcion, simbolo)
         VALUES ($1, $2, $3)
         RETURNING ${COLUMNAS}`,
        [datos.nombre, datos.descripcion, datos.simbolo]
      );
      return exito(filas[0], 201);
    } catch (error) {
      errorBaseDatos(error);
    }
  });
}

export function PUT(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");
    const cuerpo = await leerCuerpo<CuerpoCategoria>(peticion);
    const idCategoria = leerId(cuerpo.idCategoria, "El identificador de la categoría no es válido.");
    const datos = leerDatos(cuerpo);
    await comprobar(datos, idCategoria);
    try {
      const filas = await consulta<CategoriaConTotal>(
        `UPDATE categoria
         SET nombre = $2, descripcion = $3, simbolo = $4
         WHERE id_categoria = $1
         RETURNING ${COLUMNAS}`,
        [idCategoria, datos.nombre, datos.descripcion, datos.simbolo]
      );
      if (!filas[0]) throw new ErrorApi(404, "La categoría no existe.");
      return exito(filas[0]);
    } catch (error) {
      errorBaseDatos(error);
    }
  });
}
