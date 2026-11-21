
import { consulta } from "@/lib/db";

import {
  ErrorApi,
  exito,
  leerCuerpo,
  manejar,
} from "@/lib/respuesta";

import {
  requerirSesion,
} from "@/modules/autenticacion-usuarios/service";

import {
  prepararNotificacionInscripcion,
  enviarYRegistrarNotificacion,
} from "@/modules/notificaciones/service";

type Solicitud = {
  idCurso?: unknown;
};

type FilaInscripcion = {
  idInscripcion: number;
  nombreEstudiante: string;
  idUsuario: number;
  idCurso: number;
  fechaInscripcion: string;
  estado: "Activa" | "Finalizada";
};

function traducirError(error: unknown): never {
  if (
    error &&
    typeof error === "object" &&
    "code" in error
  ) {
    if (error.code === "23505") {
      throw new ErrorApi(
        409,
        "Ya tienes una inscripción registrada en este curso."
      );
    }

    if (error.code === "23503") {
      throw new ErrorApi(
        404,
        "El curso no existe."
      );
    }

    if (error.code === "P0001") {
      throw new ErrorApi(
        409,
        "No es posible inscribirse: el curso está cerrado, no tiene cupos disponibles o tu cuenta no cumple los requisitos."
      );
    }
  }

  throw error;
}

const CAMPOS = `
  SELECT
    i.id_inscripcion AS "idInscripcion",
    u.nombre AS "nombreEstudiante",
    i.id_usuario AS "idUsuario",
    i.id_curso AS "idCurso",
    i.fecha_inscripcion::text AS "fechaInscripcion",
    CASE
      WHEN i.estado = 'CONFIRMADA'
        THEN 'Activa'
      ELSE 'Finalizada'
    END AS estado
  FROM inscripcion i
  JOIN usuario u
    ON u.id_usuario = i.id_usuario
`;

/**
 * GET /api/inscripciones
 *
 * Consulta las inscripciones según los permisos
 * del usuario autenticado.
 */
export function GET() {
  return manejar(async () => {
    const sesion = await requerirSesion();
    const idUsuario = sesion.usuario.idUsuario;

    let condicion = "WHERE i.id_usuario = $1";

    // Administradores: consultar ocupación general.
    if (
      sesion.roles.includes("Administrador") ||
      sesion.roles.includes("Administrador del sistema")
    ) {
      condicion = "WHERE $1::bigint > 0";
    } else if (sesion.roles.includes("Profesor")) {
      // Profesores: consultar sus propios cursos.
      condicion = `
        WHERE i.id_usuario = $1
           OR EXISTS (
             SELECT 1
             FROM curso c
             WHERE c.id_curso = i.id_curso
               AND c.id_profesor = $1
           )
      `;
    }

    const inscripciones =
      await consulta<FilaInscripcion>(
        `${CAMPOS}
         ${condicion}
         ORDER BY
           i.fecha_inscripcion DESC,
           i.id_inscripcion DESC`,
        [idUsuario]
      );

    return exito(inscripciones);
  });
}

/**
 * POST /api/inscripciones
 *
 * RF-37: Registrar una inscripción.
 * RF-29: Notificar una inscripción confirmada.
 *
 * La base de datos:
 * - Bloquea el curso.
 * - Valida estado y disponibilidad de cupos.
 * - Evita inscripciones duplicadas.
 * - Asigna el rol Estudiante cuando corresponde.
 *
 * El correo se envía después de confirmar
 * la inscripción en PostgreSQL.
 */
export function POST(peticion: Request) {
  return manejar(async () => {
    const sesion = await requerirSesion();

    const cuerpo =
      await leerCuerpo<Solicitud>(peticion);

    const idCurso = Number(cuerpo.idCurso);

    if (
      !Number.isSafeInteger(idCurso) ||
      idCurso <= 0
    ) {
      throw new ErrorApi(
        400,
        "Selecciona un curso válido."
      );
    }

    let idInscripcion: number;

    // 1. Registrar la inscripción en PostgreSQL.
    try {
      const inscripciones = await consulta<{
        idInscripcion: number;
      }>(
        `SELECT inscribir_en_curso($1, $2)
         AS "idInscripcion"`,
        [
          sesion.usuario.idUsuario,
          idCurso,
        ]
      );

      idInscripcion = Number(
        inscripciones[0]?.idInscripcion
      );

      if (
        !Number.isSafeInteger(idInscripcion) ||
        idInscripcion <= 0
      ) {
        throw new Error(
          "La base de datos no devolvió un identificador de inscripción válido."
        );
      }
    } catch (error) {
      traducirError(error);
    }

    // 2. Preparar y solicitar el correo únicamente
    // después del registro exitoso.
    try {
      const notificacion =
        await prepararNotificacionInscripcion(
          idInscripcion
        );

      const resultado =
        await enviarYRegistrarNotificacion(
          notificacion
        );

      if (
        resultado.estadoSolicitud === "RECHAZADA"
      ) {
        console.warn(
          `Correo de inscripción ${idInscripcion} rechazado por el proveedor SMTP.`
        );
      }
    } catch (error) {
      // La inscripción ya fue confirmada.
      // Un fallo del correo o de su registro
      // no debe revertirla.
      console.error(
        "No se pudo procesar la notificación de inscripción:",
        error
      );
    }

    // 3. Responder con la inscripción confirmada,
    // independientemente del resultado del correo.
    return exito(
      {
        idInscripcion,
        idCurso,
      },
      201
    );
  });
}
