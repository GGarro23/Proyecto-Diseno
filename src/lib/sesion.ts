import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Cookie de sesión firmada (RF-02, RF-03). Guarda solo el idUsuario y la fecha de vencimiento;
// los datos y roles se leen de la BD en cada solicitud, así un cambio de rol o una
// desactivación (RF-08, RF-09) se aplica de inmediato.

const NOMBRE = "intervallum-sesion";
const DURACION_SEGUNDOS = 8 * 60 * 60; // 8 horas

function secreto(): string {
  const valor = process.env.SESION_SECRETO;
  if (!valor || valor.length < 32) throw new Error("Falta SESION_SECRETO (mínimo 32 caracteres) en el archivo .env");
  return valor;
}

const firmar = (contenido: string) => createHmac("sha256", secreto()).update(contenido).digest("base64url");

export async function crearSesion(idUsuario: number) {
  const contenido = Buffer.from(JSON.stringify({ u: idUsuario, v: Date.now() + DURACION_SEGUNDOS * 1000 })).toString("base64url");
  (await cookies()).set(NOMBRE, `${contenido}.${firmar(contenido)}`, {
    httpOnly: true, // el JavaScript del navegador no puede leerla
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function borrarSesion() {
  (await cookies()).delete(NOMBRE);
}

// idUsuario de la cookie si la firma es válida y no venció; si no, null
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