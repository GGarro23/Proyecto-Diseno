import { NextResponse } from "next/server";

// Formato común de las respuestas de la API. El frontend recibe siempre:
//   { ok: true, dato }                      si la operación funcionó
//   { ok: false, error, errores? }          si no (errores = mensajes por campo del formulario)

export class ErrorApi extends Error {
  constructor(
    public estado: number,
    mensaje: string,
    public errores?: Record<string, string>
  ) {
    super(mensaje);
  }
}

export function exito<T>(dato: T, estado = 200) {
  return NextResponse.json({ ok: true, dato }, { status: estado });
}

export function fallo(estado: number, error: string, errores?: Record<string, string>) {
  return NextResponse.json({ ok: false, error, ...(errores ? { errores } : {}) }, { status: estado });
}

// Envuelve el código de una ruta: los ErrorApi se devuelven tal cual y cualquier otro error
// se registra en la consola del servidor y se responde con un mensaje general (RNF de errores).
export async function manejar(trabajo: () => Promise<Response>): Promise<Response> {
  try {
    return await trabajo();
  } catch (error) {
    if (error instanceof ErrorApi) return fallo(error.estado, error.message, error.errores);
    console.error(error);
    return fallo(500, "Ocurrió un error inesperado. Intenta de nuevo.");
  }
}

// Lee el cuerpo JSON de la petición; si no es JSON válido responde 400
export async function leerCuerpo<T>(peticion: Request): Promise<T> {
  try {
    return (await peticion.json()) as T;
  } catch {
    throw new ErrorApi(400, "La solicitud no tiene un formato válido.");
  }
}