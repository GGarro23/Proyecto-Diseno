
import nodemailer from "nodemailer";

export type ResultadoCorreo =
  | { aceptado: true; idExterno: string }
  | { aceptado: false; error: string };

type DatosCorreo = {
  destinatario: string;
  asunto: string;
  mensaje: string;
  html?: string;
};

/**
 * Envía correos electrónicos mediante Gmail SMTP.
 *
 * Admite contenido HTML y texto plano.
 *
 * Una respuesta aceptada significa que Gmail aceptó
 * el mensaje para su procesamiento, no necesariamente
 * que ya fue entregado al destinatario.
 */
export async function enviarCorreo({
  destinatario,
  asunto,
  mensaje,
  html,
}: DatosCorreo): Promise<ResultadoCorreo> {
  const host = process.env.SMTP_HOST;
  const puerto = Number(process.env.SMTP_PORT);
  const usuario = process.env.SMTP_USUARIO;
  const clave = process.env.SMTP_CLAVE;
  const remitente = process.env.CORREO_REMITENTE;

  // Comprobar que las variables estén configuradas.
  if (
    !host ||
    !Number.isInteger(puerto) ||
    puerto <= 0 ||
    puerto > 65535 ||
    !usuario ||
    !clave ||
    !remitente
  ) {
    return {
      aceptado: false,
      error: "Servicio de correo SMTP no configurado correctamente.",
    };
  }

  // Crear la conexión con el servidor SMTP.
  const transporte = nodemailer.createTransport({
    host,
    port: puerto,
    secure: puerto === 465,
    auth: {
      user: usuario,
      pass: clave,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    const resultado = await transporte.sendMail({
      from: remitente,
      to: destinatario,
      subject: asunto,

      // Versión de texto plano.
      text: mensaje,

      // Versión visual del correo.
      html,
    });

    // Comprobar si el servidor aceptó el destinatario.
    if (
      resultado.accepted.length === 0 ||
      resultado.rejected.length > 0
    ) {
      return {
        aceptado: false,
        error: "El servidor SMTP rechazó el destinatario.",
      };
    }

    return {
      aceptado: true,
      idExterno: resultado.messageId,
    };
  } catch (error) {
    console.error(
      "Error al enviar correo mediante SMTP:",
      error instanceof Error
        ? error.message
        : "Error desconocido"
    );

    return {
      aceptado: false,
      error: "No fue posible enviar el correo mediante SMTP.",
    };
  } finally {
    transporte.close();
  }
}
