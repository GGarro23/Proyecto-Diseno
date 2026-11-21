import type { Inscripcion } from "@/modules/academia/schema";
import { cursos } from "./cursos";

// Simula lo que hará la API de la academia mientras no exista backend (RF-35 y RF-37).

const CLAVE = "intervallum-inscripciones";
const oyentes = new Set<() => void>();

// Inscripciones previas de otros estudiantes, para que los cupos coincidan con la Figura 17
const OCUPADOS: Record<number, number> = { 1: 5, 2: 5, 3: 4, 4: 2 };
const previas: Inscripcion[] = Object.entries(OCUPADOS).flatMap(([idCurso, cantidad]) =>
  Array.from({ length: cantidad }, (_, i) => ({
    idInscripcion: Number(idCurso) * 100 + i,
    idUsuario: 1000 + i,
    idCurso: Number(idCurso),
    fechaInscripcion: "2026-11-01T10:00:00.000Z",
    estado: "Activa" as const,
  }))
);

// Lectura para useSyncExternalStore: devuelve el texto guardado
export function leerGuardadas(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "[]";
  } catch {
    return "[]";
  }
}

export function suscribirInscripciones(avisar: () => void) {
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
  };
}

export function todasLasInscripciones(guardadas: string): Inscripcion[] {
  return [...previas, ...(JSON.parse(guardadas) as Inscripcion[])];
}

export function cuposDisponibles(idCurso: number, inscripciones: Inscripcion[]) {
  const curso = cursos.find((c) => c.idCurso === idCurso);
  if (!curso) return 0;
  const ocupados = inscripciones.filter((i) => i.idCurso === idCurso && i.estado === "Activa").length;
  return Math.max(curso.cupoMaximo - ocupados, 0);
}

// RF-37: inscripción con validación de curso abierto, cupos y duplicados
export function inscribir(idUsuario: number, idCurso: number): { ok: true } | { ok: false; error: string } {
  const curso = cursos.find((c) => c.idCurso === idCurso);
  if (!curso) return { ok: false, error: "El curso no existe." };
  if (curso.estado === "Cerrado") return { ok: false, error: "El curso está cerrado." };

  const guardadas = JSON.parse(leerGuardadas()) as Inscripcion[];
  const inscripciones = [...previas, ...guardadas];
  if (inscripciones.some((i) => i.idUsuario === idUsuario && i.idCurso === idCurso && i.estado === "Activa")) {
    return { ok: false, error: "Ya estás inscrito en este curso." };
  }
  if (cuposDisponibles(idCurso, inscripciones) === 0) {
    return { ok: false, error: "El curso no tiene cupos disponibles." };
  }

  // En el backend: transacción que evita inscripciones simultáneas al último cupo
  // y asigna el rol Estudiante al Cliente en su primera inscripción.
  const nueva: Inscripcion = {
    idInscripcion: Date.now(),
    idUsuario,
    idCurso,
    fechaInscripcion: new Date().toISOString(),
    estado: "Activa",
  };
  try {
    localStorage.setItem(CLAVE, JSON.stringify([...guardadas, nueva]));
  } catch {}
  oyentes.forEach((avisar) => avisar());
  return { ok: true };
}