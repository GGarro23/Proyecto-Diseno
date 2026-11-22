
import { consulta } from "@/lib/db";

export type TipoEventoCorreo =
  | "COMPRA_CONFIRMADA"
  | "CAMBIO_ESTADO_PEDIDO"
  | "INSCRIPCION_CONFIRMADA";

export type EstadoSolicitudCorreo =
  | "ACEPTADA"
  | "RECHAZADA";

// Registrar el resultado de una solicitud de notificación.
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

// Consultar las notificaciones de un usuario.
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

// Consultar notificaciones asociadas a un pedido.
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


/**
 * Obtiene el usuario y el correo asociados
 * a un pedido registrado.
 *
 * No envía correos ni modifica información.
 */
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
