import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const NOMBRE = "intervallum-sesion";
const DURACION_SEGUNDOS = 8 * 60 * 60;

function secreto(): string {
  const valor = process.env.SESION_SECRETO;
  if (!valor || valor.length < 32) throw new Error("Falta SESION_SECRETO (mínimo 32 caracteres) en el archivo .env");
  return valor;
}

const firmar = (contenido: string) => createHmac("sha256", secreto()).update(contenido).digest("base64url");

export async function crearSesion(idUsuario: number) {
  const contenido = Buffer.from(JSON.stringify({ u: idUsuario, v: Date.now() + DURACION_SEGUNDOS * 1000 })).toString("base64url");
  (await cookies()).set(NOMBRE, `${contenido}.${firmar(contenido)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function borrarSesion() {
  (await cookies()).delete(NOMBRE);
}

export async function idUsuarioDeSesion(): Promise<number | null> {
  const valor = (await cookies()).get(NOMBRE)?.value;
  if (!valor) return null;
  const [contenido, firma] = valor.split(".");
  if (!contenido || !firma) return null;
  const esperada = Buffer.from(firmar(contenido));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  try {
    const { u, v } = JSON.parse(Buffer.from(contenido, "base64url").toString()) as { u: number; v: number };
    return Date.now() < v ? u : null;
  } catch {
    return null;
  }
}