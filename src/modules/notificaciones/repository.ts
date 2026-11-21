
import { consulta } from "@/lib/db";

export type TipoEventoCorreo =
  | "COMPRA_CONFIRMADA"
  | "CAMBIO_ESTADO_PEDIDO"
  | "INSCRIPCION_CONFIRMADA";

export type EstadoSolicitudCorreo =
  | "ACEPTADA"
  | "RECHAZADA";

export async function registrarNotificacion(
  idUsuario: number,
  tipoEvento: TipoEventoCorreo,
  destinatario: string,
  estadoSolicitud: EstadoSolicitudCorreo,
  detalleError: string | null,
  idPedido: number | null,
  idInscripcion: number | null
) {
  const filas = await consulta<{
    idNotificacion: number;
  }>(
    `INSERT INTO notificacion_correo (
       id_usuario,
       tipo_evento,
       destinatario,
       estado_solicitud,
       detalle_error,
       id_pedido,
       id_inscripcion
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id_notificacion AS "idNotificacion"`,
    [
      idUsuario,
      tipoEvento,
      destinatario,
      estadoSolicitud,
      detalleError,
      idPedido,
      idInscripcion,
    ]
  );

  return filas[0].idNotificacion;
}

export async function obtenerNotificacionesUsuario(
  idUsuario: number
) {
  return consulta<{
    idNotificacion: number;
    tipoEvento: TipoEventoCorreo;
    destinatario: string;
    estadoSolicitud: EstadoSolicitudCorreo;
    fechaSolicitud: Date;
    detalleError: string | null;
    idPedido: number | null;
    idInscripcion: number | null;
  }>(
    `SELECT
       id_notificacion AS "idNotificacion",
       tipo_evento AS "tipoEvento",
       destinatario,
       estado_solicitud AS "estadoSolicitud",
       fecha_solicitud AS "fechaSolicitud",
       detalle_error AS "detalleError",
       id_pedido AS "idPedido",
       id_inscripcion AS "idInscripcion"
     FROM notificacion_correo
     WHERE id_usuario = $1
     ORDER BY fecha_solicitud DESC, id_notificacion DESC`,
    [idUsuario]
  );
}

export async function obtenerNotificacionesPedido(
  idPedido: number
) {
  return consulta<{
    idNotificacion: number;
    idUsuario: number;
    tipoEvento: TipoEventoCorreo;
    destinatario: string;
    estadoSolicitud: EstadoSolicitudCorreo;
    fechaSolicitud: Date;
    detalleError: string | null;
  }>(
    `SELECT
       id_notificacion AS "idNotificacion",
       id_usuario AS "idUsuario",
       tipo_evento AS "tipoEvento",
       destinatario,
       estado_solicitud AS "estadoSolicitud",
       fecha_solicitud AS "fechaSolicitud",
       detalle_error AS "detalleError"
     FROM notificacion_correo
     WHERE id_pedido = $1
     ORDER BY fecha_solicitud DESC, id_notificacion DESC`,
    [idPedido]
  );
}


export async function obtenerDestinatarioPedido(
  idPedido: number
) {
  const filas = await consulta<{
    idUsuario: number;
    correo: string;
    nombre: string;
  }>(
    `SELECT
       u.id_usuario AS "idUsuario",
       u.correo,
       u.nombre
     FROM pedido p
     INNER JOIN usuario u
       ON u.id_usuario = p.id_usuario
     WHERE p.id_pedido = $1`,
    [idPedido]
  );

  return filas[0] ?? null;
}

/**
 * Obtener los datos de una inscripción confirmada
 * para preparar su notificación por correo.
 *
 * Consulta la información desde PostgreSQL.
 * No modifica la inscripción ni envía correos.
 */
export async function obtenerDestinatarioInscripcion(
  idInscripcion: number
) {
  const filas = await consulta<{
    idUsuario: number;
    correo: string;
    nombreEstudiante: string;
    nombreCurso: string;
    idCurso: number;
  }>(
    `SELECT
       u.id_usuario AS "idUsuario",
       u.correo,
       u.nombre AS "nombreEstudiante",
       c.nombre AS "nombreCurso",
       c.id_curso AS "idCurso"
     FROM inscripcion i
     INNER JOIN usuario u
       ON u.id_usuario = i.id_usuario
     INNER JOIN curso c
       ON c.id_curso = i.id_curso
     WHERE i.id_inscripcion = $1
       AND i.estado = 'CONFIRMADA'`,
    [idInscripcion]
  );

  return filas[0] ?? null;
}
