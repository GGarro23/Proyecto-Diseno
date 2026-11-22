
import { Resend } from "resend";

export type ResultadoCorreo =
  | { aceptado: true; idExterno: string }
  | { aceptado: false; error: string };

type DatosCorreo = {
  destinatario: string;
  asunto: string;
  mensaje: string;
};

/**
 * Solicita el envío de un correo electrónico.
 *
 * Si el proveedor no está configurado,
 * devuelve un resultado rechazado.
 */
export async function enviarCorreo({
  destinatario,
  asunto,
  mensaje,
}: DatosCorreo): Promise<ResultadoCorreo> {
  const apiKey = process.env.RESEND_API_KEY;
  const remitente = process.env.CORREO_REMITENTE;

  if (!apiKey || !remitente) {
    return {
      aceptado: false,
      error: "Servicio de correo no configurado.",
    };
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: remitente,
      to: destinatario,
      subject: asunto,
      text: mensaje,
    });

    if (error || !data?.id) {
      return {
        aceptado: false,
        error: error?.message ?? "El proveedor rechazó la solicitud.",
      };
    }

    return {
      aceptado: true,
      idExterno: data.id,
    };
  } catch {
    return {
      aceptado: false,
      error: "No fue posible contactar al servicio de correo.",
    };
  }
}
