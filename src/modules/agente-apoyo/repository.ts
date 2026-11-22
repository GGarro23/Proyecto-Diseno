import type { PoolClient } from "pg";
import { consulta } from "@/lib/db";
import type { Curso, Inscripcion } from "@/modules/academia/schema";
import type { Producto } from "@/modules/catalogo-inventario/schema";
import type { Recomendacion, RecomendacionDetalle } from "./schema";

// Acceso a datos de AF-07 (tabla recomendacion). El agente lee productos, cursos e inscripciones
// con su propio SQL y solo escribe en recomendacion (Restricción 5 del agente).
// Los valores de la BD (REABASTECIMIENTO, PENDIENTE...) se traducen a los del frontend aquí.
// Las fechas se devuelven en hora de Costa Rica como texto "AAAA-MM-DDTHH:MM:SS".

const TIPO_A_BD: Record<Recomendacion["tipo"], string> = {
  Reabastecimiento: "REABASTECIMIENTO",
  "Promoción académica": "PROMOCION_ACADEMICA",
};

const COLUMNAS = `
  r.id_recomendacion AS "idRecomendacion",
  CASE r.tipo WHEN 'REABASTECIMIENTO' THEN 'Reabastecimiento' ELSE 'Promoción académica' END AS tipo,
  r.id_producto AS "idProducto",
  r.id_curso AS "idCurso",
  r.motivo,
  to_char(r.fecha_generacion AT TIME ZONE 'America/Costa_Rica', 'YYYY-MM-DD"T"HH24:MI:SS') AS "fechaGeneracion",
  CASE r.estado WHEN 'PENDIENTE' THEN 'Pendiente' ELSE 'Revisada' END AS estado,
  to_char(r.fecha_revision AT TIME ZONE 'America/Costa_Rica', 'YYYY-MM-DD"T"HH24:MI:SS') AS "fechaRevision",
  r.id_revisor AS "idRevisor",
  COALESCE(p.nombre, c.nombre, '') AS elemento,
  u.nombre AS revisor`;

const DESDE = `
  FROM recomendacion r
  LEFT JOIN producto p ON p.id_producto = r.id_producto
  LEFT JOIN curso c ON c.id_curso = r.id_curso
  LEFT JOIN usuario u ON u.id_usuario = r.id_revisor`;

// RF-47
export async function listar(): Promise<RecomendacionDetalle[]> {
  return consulta<RecomendacionDetalle>(`SELECT ${COLUMNAS} ${DESDE} ORDER BY r.fecha_generacion DESC, r.id_recomendacion DESC`);
}

export async function buscar(idRecomendacion: number): Promise<RecomendacionDetalle | null> {
  const filas = await consulta<RecomendacionDetalle>(`SELECT ${COLUMNAS} ${DESDE} WHERE r.id_recomendacion = $1`, [idRecomendacion]);
  return filas[0] ?? null;
}

// ---------- Datos que el agente evalúa (solo lectura) ----------

export async function productos(): Promise<Producto[]> {
  return consulta<Producto>(
    `SELECT id_producto AS "idProducto", id_categoria AS "idCategoria", codigo, nombre,
            COALESCE(descripcion, '') AS descripcion, precio, activo, existencias,
            COALESCE(imagen_url, '') AS "imagenUrl"
       FROM producto`
  );
}

export async function cursos(): Promise<Curso[]> {
  return consulta<Curso>(
    `SELECT id_curso AS "idCurso", nombre, descripcion, cupo_maximo AS "cupoMaximo",
            CASE estado WHEN 'ABIERTO' THEN 'Abierto' ELSE 'Cerrado' END AS estado,
            id_profesor AS "idProfesor", COALESCE(imagen_url, '') AS "imagenUrl"
       FROM curso`
  );
}

export async function inscripciones(): Promise<Inscripcion[]> {
  return consulta<Inscripcion>(
    `SELECT id_inscripcion AS "idInscripcion", id_usuario AS "idUsuario", id_curso AS "idCurso",
            fecha_inscripcion::TEXT AS "fechaInscripcion",
            CASE estado WHEN 'CONFIRMADA' THEN 'Activa' ELSE 'Finalizada' END AS estado
       FROM inscripcion`
  );
}

// ---------- Escritura ----------

// RF-45 y RF-46: guarda las propuestas como Pendientes. ON CONFLICT respeta el índice único
// de la BD que impide dos reabastecimientos pendientes del mismo producto.
export async function registrar(
  cliente: PoolClient,
  tipo: Recomendacion["tipo"],
  propuestas: { idElemento: number; motivo: string }[]
): Promise<number> {
  let creadas = 0;
  for (const p of propuestas) {
    const { rowCount } = await cliente.query(
      `INSERT INTO recomendacion (tipo, id_producto, id_curso, motivo)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [TIPO_A_BD[tipo], tipo === "Reabastecimiento" ? p.idElemento : null, tipo === "Promoción académica" ? p.idElemento : null, p.motivo]
    );
    creadas += rowCount ?? 0;
  }
  return creadas;
}

// RF-48: solo pasa de PENDIENTE a REVISADA; devuelve false si ya estaba revisada o no existe
export async function marcarRevisada(idRecomendacion: number, idRevisor: number): Promise<boolean> {
  const filas = await consulta(
    `UPDATE recomendacion SET estado = 'REVISADA', fecha_revision = NOW(), id_revisor = $2
      WHERE id_recomendacion = $1 AND estado = 'PENDIENTE'
      RETURNING id_recomendacion`,
    [idRecomendacion, idRevisor]
  );
  return filas.length > 0;
}
