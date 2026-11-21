import type { PoolClient } from "pg";
import { consulta } from "@/lib/db";
import type { Categoria, Producto } from "@/modules/catalogo-inventario/schema";
import type { ErrorFila, FilaValida } from "./reglas";
import type { EjecucionDetalle, EjecucionETL, ErrorETL } from "./schema";

const ESTADO_A_BD: Record<EjecucionETL["estado"], string> = {
  Exitosa: "EXITOSA",
  "Parcialmente Exitosa": "PARCIALMENTE_EXITOSA",
  Fallida: "FALLIDA",
};

export async function productos(): Promise<Producto[]> {
  return consulta<Producto>(
    `SELECT id_producto AS "idProducto", id_categoria AS "idCategoria", codigo, nombre,
            COALESCE(descripcion, '') AS descripcion, precio, activo, existencias,
            COALESCE(imagen_url, '') AS "imagenUrl"
       FROM producto`
  );
}

export async function categorias(): Promise<Categoria[]> {
  return consulta<Categoria>(`SELECT id_categoria AS "idCategoria", nombre FROM categoria`);
}

export async function crearEjecucion(cliente: PoolClient, idAdministrador: number, nombreArchivo: string): Promise<number> {
  const { rows } = await cliente.query<{ idEjecucion: number }>(
    `INSERT INTO ejecucion_etl (id_administrador, nombre_archivo, estado)
     VALUES ($1, $2, 'FALLIDA') RETURNING id_ejecucion AS "idEjecucion"`,
    [idAdministrador, nombreArchivo]
  );
  return rows[0].idEjecucion;
}

export async function cargarFila(cliente: PoolClient, idEjecucion: number, fila: FilaValida): Promise<ErrorFila | null> {
  await cliente.query("SAVEPOINT fila_etl");
  try {
    const { rows } = await cliente.query<{ idProducto: number }>(
      `SELECT cargar_producto_etl($1, $2, $3, $4, $5, $6) AS "idProducto"`,
      [idEjecucion, fila.idCategoria, fila.codigo, fila.nombre, fila.precio, fila.existencias]
    );
    if (fila.descripcion || fila.imagenUrl) {
      await cliente.query(`UPDATE producto SET descripcion = NULLIF($2, ''), imagen_url = NULLIF($3, '') WHERE id_producto = $1`, [
        rows[0].idProducto,
        fila.descripcion,
        fila.imagenUrl,
      ]);
    }
    await cliente.query("RELEASE SAVEPOINT fila_etl");
    return null;
  } catch (error) {
    await cliente.query("ROLLBACK TO SAVEPOINT fila_etl");
    const codigo = (error as { code?: string }).code;
    const motivo = codigo === "23505" ? `El código ${fila.codigo} ya está registrado.` : "La fila no se pudo cargar por una restricción de los datos.";
    return { numeroFila: fila.numeroFila, campo: codigo === "23505" ? "código" : null, motivo };
  }
}

export async function cerrarEjecucion(
  cliente: PoolClient,
  idEjecucion: number,
  estado: EjecucionETL["estado"],
  filasAceptadas: number,
  filasRechazadas: number,
  errores: ErrorFila[]
) {
  await cliente.query(`UPDATE ejecucion_etl SET estado = $2, filas_aceptadas = $3, filas_rechazadas = $4 WHERE id_ejecucion = $1`, [
    idEjecucion,
    ESTADO_A_BD[estado],
    filasAceptadas,
    filasRechazadas,
  ]);
  for (const e of errores) {
    await cliente.query(`INSERT INTO error_etl (id_ejecucion, numero_fila, campo, motivo) VALUES ($1, $2, $3, $4)`, [
      idEjecucion,
      e.numeroFila,
      e.campo,
      e.motivo,
    ]);
  }
}

export async function ejecuciones(): Promise<EjecucionDetalle[]> {
  return consulta<EjecucionDetalle>(
    `SELECT e.id_ejecucion AS "idEjecucion", e.id_administrador AS "idAdministrador", e.nombre_archivo AS "nombreArchivo",
            to_char(e.fecha_ejecucion AT TIME ZONE 'America/Costa_Rica', 'YYYY-MM-DD"T"HH24:MI:SS') AS "fechaEjecucion", -- hora de Costa Rica
            CASE e.estado WHEN 'EXITOSA' THEN 'Exitosa' WHEN 'PARCIALMENTE_EXITOSA' THEN 'Parcialmente Exitosa' ELSE 'Fallida' END AS estado,
            e.filas_aceptadas AS "filasAceptadas", e.filas_rechazadas AS "filasRechazadas",
            u.nombre AS responsable
       FROM ejecucion_etl e JOIN usuario u ON u.id_usuario = e.id_administrador
      ORDER BY e.id_ejecucion DESC`
  );
}

export async function errores(): Promise<ErrorETL[]> {
  return consulta<ErrorETL>(
    `SELECT id_error AS "idError", id_ejecucion AS "idEjecucion", numero_fila AS "numeroFila", campo, motivo
       FROM error_etl ORDER BY id_ejecucion, id_error`
  );
}
