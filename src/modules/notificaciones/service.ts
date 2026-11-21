
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

// Escapar texto dinámico para insertarlo de forma
// segura dentro del HTML del correo.
function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, (caracter) => {
    const reemplazos: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return reemplazos[caracter];
  });
}

/**
 * Plantilla visual reutilizable para las notificaciones
 * por correo de Intervallum.
 *
 * Se utilizan estilos en línea para mejorar la
 * compatibilidad con Gmail y otros clientes de correo.
 */
function plantillaCorreo(params: {
  titulo: string;
  mensaje: string;
  etiquetaDetalle?: string;
  valorDetalle?: string;
  estado?: string;
}): string {
  const {
    titulo,
    mensaje,
    etiquetaDetalle,
    valorDetalle,
    estado,
  } = params;

  const tituloSeguro = escaparHtml(titulo);
  const mensajeSeguro = escaparHtml(mensaje);

  const detalle =
    etiquetaDetalle && valorDetalle
      ? `
        <div style="
          margin-top:24px;
          padding:20px;
          background-color:#f9f5ef;
          border:1px solid #eadfce;
          border-radius:10px;
        ">
          <p style="
            margin:0 0 6px;
            font-size:12px;
            font-weight:bold;
            letter-spacing:1px;
            text-transform:uppercase;
            color:#8a8178;
          ">
            ${escaparHtml(etiquetaDetalle)}
          </p>

          <p style="
            margin:0;
            font-size:22px;
            font-weight:bold;
            color:#4b3428;
          ">
            ${escaparHtml(valorDetalle)}
          </p>

          ${
            estado
              ? `
                <p style="
                  margin:12px 0 0;
                  font-size:14px;
                  line-height:1.6;
                  color:#5d5149;
                ">
                  Estado:
                  <strong>${escaparHtml(estado)}</strong>
                </p>
              `
              : ""
          }
        </div>
      `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport"
              content="width=device-width, initial-scale=1.0" />
        <title>${tituloSeguro} - Intervallum</title>
      </head>

      <body style="
        margin:0;
        padding:0;
        background-color:#f6f1eb;
        font-family:Arial, Helvetica, sans-serif;
      ">
        <div style="
          width:100%;
          background-color:#f6f1eb;
          padding:36px 12px;
          box-sizing:border-box;
        ">
          <div style="
            max-width:600px;
            margin:0 auto;
            background-color:#ffffff;
            border:1px solid #e7dccf;
            border-radius:14px;
            overflow:hidden;
          ">

            <!-- Encabezado -->
            <div style="
              background-color:#8a5a3b;
              padding:30px 32px;
              text-align:center;
            ">
              <p style="
                margin:0;
                color:#f9eee4;
                font-size:12px;
                font-weight:bold;
                letter-spacing:3px;
                text-transform:uppercase;
              ">
                INTERVALLUM
              </p>

              <h1 style="
                margin:14px 0 0;
                color:#ffffff;
                font-size:28px;
                line-height:1.3;
                font-weight:bold;
              ">
                ${tituloSeguro}
              </h1>
            </div>

            <!-- Contenido -->
            <div style="padding:32px;">
              <p style="
                margin:0 0 16px;
                color:#4b4038;
                font-size:16px;
                line-height:1.8;
              ">
                ¡Hola!
              </p>

              <p style="
                margin:0;
                color:#4b4038;
                font-size:16px;
                line-height:1.8;
              ">
                ${mensajeSeguro}
              </p>

              ${detalle}

              <p style="
                margin:28px 0 0;
                color:#6b625c;
                font-size:14px;
                line-height:1.8;
              ">
                Gracias por confiar en
                <strong>Intervallum</strong>.
              </p>
            </div>

            <!-- Pie del correo -->
            <div style="
              background-color:#fcfaf7;
              border-top:1px solid #eee3d6;
              padding:22px 32px;
              text-align:center;
            ">
              <p style="
                margin:0;
                font-size:12px;
                line-height:1.7;
                color:#8a8178;
              ">
                Este es un mensaje automático de Intervallum.
                <br />
                Por favor, no respondas a este correo.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
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
 * Preparar una notificación de compra confirmada.
 *
 * Devuelve tanto el contenido de texto plano como
 * su representación HTML.
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

  const mensaje =
    `Tu compra correspondiente al pedido #${idPedido} ` +
    "ha sido confirmada correctamente.";

  return {
    idUsuario: destinatario.idUsuario,
    idPedido,
    tipoEvento: "COMPRA_CONFIRMADA" as const,
    destinatario: destinatario.correo,
    asunto: `Confirmación de compra - Pedido #${idPedido}`,
    mensaje,
    html: plantillaCorreo({
      titulo: "¡Compra confirmada!",
      mensaje,
      etiquetaDetalle: "Número de pedido",
      valorDetalle: `#${idPedido}`,
      estado: "Pago confirmado",
    }),
  };
}

/**
 * Preparar una notificación cuando cambia
 * el estado operativo de un pedido.
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

  const mensaje =
    `El estado de tu pedido #${idPedido} ` +
    `ha cambiado a: ${estado}.`;

  return {
    idUsuario: destinatario.idUsuario,
    idPedido,
    tipoEvento: "CAMBIO_ESTADO_PEDIDO" as const,
    destinatario: destinatario.correo,
    asunto: `Actualización de pedido #${idPedido}`,
    mensaje,
    html: plantillaCorreo({
      titulo: "Actualización de pedido",
      mensaje,
      etiquetaDetalle: "Número de pedido",
      valorDetalle: `#${idPedido}`,
      estado,
    }),
  };
}

/**
 * Solicita el envío de una notificación y registra
 * el resultado devuelto por el servidor SMTP.
 *
 * ACEPTADA significa que el servidor aceptó el correo,
 * no que fue entregado en la bandeja del destinatario.
 */
export async function enviarYRegistrarNotificacion(
  datos: {
    idUsuario: number;
    tipoEvento: TipoEventoCorreo;
    destinatario: string;
    asunto: string;
    mensaje: string;
    html?: string;
    idPedido?: number | null;
    idInscripcion?: number | null;
  }
) {
  const resultado = await enviarCorreo({
    destinatario: datos.destinatario,
    asunto: datos.asunto,
    mensaje: datos.mensaje,
    html: datos.html,
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
