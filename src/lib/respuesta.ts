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

const TAMANO_MAXIMO_CUERPO = 12 * 1024 * 1024;

export async function leerCuerpo<T>(peticion: Request): Promise<T> {
  const tamano = Number(peticion.headers.get("content-length") ?? 0);
  if (tamano > TAMANO_MAXIMO_CUERPO) throw new ErrorApi(413, "La solicitud es demasiado grande.");
  let cuerpo: unknown;
  try {
    cuerpo = await peticion.json();
  } catch {
    throw new ErrorApi(400, "La solicitud no tiene un formato válido.");
  }
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
    throw new ErrorApi(400, "La solicitud no tiene un formato válido.");
  }
  return cuerpo as T;
}

export function leerId(valor: unknown, mensaje = "El identificador no es válido."): number {
  const texto = typeof valor === "number" ? String(valor) : typeof valor === "string" ? valor.trim() : "";
  const id = Number(texto);
  if (!/^[1-9]\d*$/.test(texto) || !Number.isSafeInteger(id)) throw new ErrorApi(400, mensaje);
  return id;
}