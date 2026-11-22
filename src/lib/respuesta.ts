import { NextResponse } from "next/server";

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

export async function manejar(trabajo: () => Promise<Response>): Promise<Response> {
  try {
    return await trabajo();
  } catch (error) {
    if (error instanceof ErrorApi) return fallo(error.estado, error.message, error.errores);
    console.error(error);
    return fallo(500, "Ocurrió un error inesperado. Intenta de nuevo.");
  }
}

export async function leerCuerpo<T>(peticion: Request): Promise<T> {
  try {
    return (await peticion.json()) as T;
  } catch {
    throw new ErrorApi(400, "La solicitud no tiene un formato válido.");
  }
}