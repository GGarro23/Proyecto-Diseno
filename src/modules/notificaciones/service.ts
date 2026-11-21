
import { ErrorApi } from "@/lib/respuesta";
import { requerirSesion } from "@/modules/autenticacion-usuarios/service";

import * as repositorio from "./repository";

import type {
  TipoEventoCorreo,
  EstadoSolicitudCorreo,
} from "./repository";

// Validar identificadores.
function validarId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ErrorApi(
      400,
      "El identificador proporcionado no es válido."
    );
  }
}

/**
 * Consultar las notificaciones del usuario autenticado.
 */
export async function consultarMisNotificaciones() {
  const sesion = await requerirSesion();

  return repositorio.obtenerNotificacionesUsuario(
    sesion.usuario.idUsuario
  );
}

/**
 * Registrar internamente una solicitud de notificación.
 *
 * Esta función no envía un correo por sí misma.
 * No debe exponerse como una API pública que permita
 * registrar notificaciones arbitrarias.
 */
export async function registrarEventoNotificacion(
  idUsuario: number,
  tipoEvento: TipoEventoCorreo,
  destinatario: string,
  estadoSolicitud: EstadoSolicitudCorreo,
  detalleError: string | null = null,
  idPedido: number | null = null,
  idInscripcion: number | null = null
) {
  validarId(idUsuario);

  if (idPedido !== null) validarId(idPedido);
  if (idInscripcion !== null) validarId(idInscripcion);

  if (
    !destinatario ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario)
  ) {
    throw new ErrorApi(
      400,
      "El correo del destinatario no es válido."
    );
  }

  const eventosValidos: TipoEventoCorreo[] = [
    "COMPRA_CONFIRMADA",
    "CAMBIO_ESTADO_PEDIDO",
    "INSCRIPCION_CONFIRMADA",
  ];

  if (!eventosValidos.includes(tipoEvento)) {
    throw new ErrorApi(
      400,
      "El tipo de evento no es válido."
    );
  }

  if (
    estadoSolicitud !== "ACEPTADA" &&
    estadoSolicitud !== "RECHAZADA"
  ) {
    throw new ErrorApi(
      400,
      "El estado de la solicitud no es válido."
    );
  }

  return repositorio.registrarNotificacion(
    idUsuario,
    tipoEvento,
    destinatario,
    estadoSolicitud,
    detalleError,
    idPedido,
    idInscripcion
  );
}

/**
 * Consultar las notificaciones relacionadas con un pedido.
 *
 * Verifica primero que el usuario tenga permiso
 * para consultar ese pedido.
 */
export async function consultarNotificacionesPedido(
  idPedido: number
) {
  validarId(idPedido);

  const { consultarDetallePedido } = await import(
    "@/modules/gestion-pedidos/service"
  );

  await consultarDetallePedido(idPedido);

  return repositorio.obtenerNotificacionesPedido(idPedido);
}

/**
 * Prepara los datos para notificar una compra confirmada.
 *
 * No envía el correo todavía.
 * La integración con el proveedor de correo
 * se realizará por separado.
 */
export async function prepararNotificacionCompra(
  idPedido: number
) {
  validarId(idPedido);

  const destinatario =
    await repositorio.obtenerDestinatarioPedido(idPedido);

  if (!destinatario) {
    throw new ErrorApi(
      404,
      "No se encontró el destinatario del pedido."
    );
  }

  return {
    idUsuario: destinatario.idUsuario,
    idPedido,
    tipoEvento: "COMPRA_CONFIRMADA" as const,
    destinatario: destinatario.correo,
    asunto: `Confirmación de compra - Pedido #${idPedido}`,
    mensaje:
      `Tu compra correspondiente al pedido #${idPedido} ` +
      "ha sido confirmada correctamente.",
  };
}
