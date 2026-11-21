
import { ErrorApi } from "@/lib/respuesta";
import { requerirSesion } from "@/modules/autenticacion-usuarios/service";
import { enviarCorreo } from "@/lib/correo";
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

/**
 * Prepara una notificación cuando cambia
 * el estado operativo de un pedido.
 *
 * No envía correos ni registra una solicitud
 * como aceptada.
 */
export async function prepararNotificacionEstadoPedido(
  idPedido: number
) {
  validarId(idPedido);

  const { obtenerPedido } = await import(
    "@/modules/gestion-pedidos/repository"
  );

  const pedido = await obtenerPedido(idPedido);

  if (!pedido) {
    throw new ErrorApi(
      404,
      "Pedido no encontrado."
    );
  }

  const destinatario =
    await repositorio.obtenerDestinatarioPedido(idPedido);

  if (!destinatario) {
    throw new ErrorApi(
      404,
      "No se encontró el destinatario del pedido."
    );
  }

  const nombresEstados: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En preparación",
    EMPACADO: "Empacado",
    ENVIADO: "Enviado",
    LISTO_RETIRO: "Listo para retirar",
    RETIRADO: "Retirado",
  };

  const estado =
    nombresEstados[pedido.estadoOperativo] ??
    pedido.estadoOperativo;

  return {
    idUsuario: destinatario.idUsuario,
    idPedido,
    tipoEvento: "CAMBIO_ESTADO_PEDIDO" as const,
    destinatario: destinatario.correo,
    asunto: `Actualización de pedido #${idPedido}`,
    mensaje:
      `El estado de tu pedido #${idPedido} ` +
      `ha cambiado a: ${estado}.`,
  };
}


/**
 * Solicita el envío de una notificación y registra
 * el resultado devuelto por el proveedor.
 *
 * Una respuesta ACEPTADA significa que el proveedor
 * aceptó la solicitud, no que el correo fue entregado.
 */
export async function enviarYRegistrarNotificacion(
  datos: {
    idUsuario: number;
    tipoEvento: TipoEventoCorreo;
    destinatario: string;
    asunto: string;
    mensaje: string;
    idPedido?: number | null;
    idInscripcion?: number | null;
  }
) {
  const resultado = await enviarCorreo({
    destinatario: datos.destinatario,
    asunto: datos.asunto,
    mensaje: datos.mensaje,
  });

  const estadoSolicitud: EstadoSolicitudCorreo =
    resultado.aceptado ? "ACEPTADA" : "RECHAZADA";

  const detalleError = resultado.aceptado
    ? null
    : resultado.error;

  const idNotificacion =
    await registrarEventoNotificacion(
      datos.idUsuario,
      datos.tipoEvento,
      datos.destinatario,
      estadoSolicitud,
      detalleError,
      datos.idPedido ?? null,
      datos.idInscripcion ?? null
    );

  return {
    idNotificacion,
    estadoSolicitud,
  };
}
