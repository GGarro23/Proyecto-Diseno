import { consulta } from "@/lib/db";
import {
  ErrorApi,
  exito,
  leerCuerpo,
  manejar,
} from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";
import { obtenerCategorias } from "@/modules/catalogo-inventario/consultas";
import { validarCategoria } from "@/modules/catalogo-inventario/validaciones";

type DatosCategoria = {
  nombre?: unknown;
  idCategoria?: unknown;
};

function validarNombre(valor: unknown): string {
  if (typeof valor !== "string" || !valor.trim()) {
    throw new ErrorApi(400, "Indica el nombre de la categoría.");
  }

  const nombre = valor.trim();

  if (nombre.length > 120) {
    throw new ErrorApi(
      400,
      "El nombre no puede superar los 120 caracteres."
    );
  }

  return nombre;
}

function manejarErrorBD(error: unknown): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    throw new ErrorApi(409, "Ya existe una categoría con ese nombre.");
  }

  throw error;
}

export function GET() {
  return manejar(async () => {
    const categorias = await consulta<{
      idCategoria: number;
      nombre: string;
      totalProductos: number;
    }>(`
      SELECT
        c.id_categoria AS "idCategoria",
        c.nombre,
        COUNT(p.id_producto)::integer AS "totalProductos"
      FROM categoria c
      LEFT JOIN producto p
        ON p.id_categoria = c.id_categoria
      GROUP BY c.id_categoria, c.nombre
      ORDER BY c.nombre
    `);

    return exito(categorias);
  });
}

export function POST(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");

    const datos = await leerCuerpo<DatosCategoria>(peticion);
    const nombre = validarNombre(datos.nombre);

    const categorias = await obtenerCategorias();
    const error = validarCategoria(nombre, categorias);

    if (error) {
      throw new ErrorApi(
        error.includes("Ya existe") ? 409 : 400,
        error
      );
    }

    try {
      const resultado = await consulta<{
        idCategoria: number;
        nombre: string;
      }>(
        `INSERT INTO categoria (nombre)
         VALUES ($1)
         RETURNING
           id_categoria AS "idCategoria",
           nombre`,
        [nombre]
      );

      return exito(resultado[0], 201);
    } catch (error) {
      manejarErrorBD(error);
    }
  });
}

export function PUT(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");

    const datos = await leerCuerpo<DatosCategoria>(peticion);

    const idCategoria = Number(datos.idCategoria);
    const nombre = validarNombre(datos.nombre);

    if (!Number.isSafeInteger(idCategoria) || idCategoria <= 0) {
      throw new ErrorApi(400, "Identificador de categoría inválido.");
    }

    const categorias = await obtenerCategorias();

    if (!categorias.some(c => c.idCategoria === idCategoria)) {
      throw new ErrorApi(404, "La categoría no existe.");
    }

    const error = validarCategoria(
      nombre,
      categorias,
      idCategoria
    );

    if (error) throw new ErrorApi(409, error);

    try {
      const resultado = await consulta<{
        idCategoria: number;
        nombre: string;
      }>(
        `UPDATE categoria
         SET nombre = $2
         WHERE id_categoria = $1
         RETURNING
           id_categoria AS "idCategoria",
           nombre`,
        [idCategoria, nombre]
      );

      if (!resultado[0]) {
        throw new ErrorApi(404, "La categoría no existe.");
      }

      return exito(resultado[0]);
    } catch (error) {
      manejarErrorBD(error);
    }
  });
}