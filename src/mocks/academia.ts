import type { Asistencia, Inscripcion } from "@/modules/academia/schema";
import { cursos } from "./cursos";

// Simula lo que hará la API de la academia mientras no exista backend
// (RF-35, RF-37, RF-39 a RF-43).

const CLAVE_INSCRIPCIONES = "intervallum-inscripciones";
const CLAVE_ASISTENCIAS = "intervallum-asistencias";
const oyentes = new Set<() => void>();

type Resultado = { ok: true } | { ok: false; error: string };

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
).concat([
  // Ana Mora (idUsuario 1) en Piano esencial, como en las Figuras 19 y 22
  { idInscripcion: 1, idUsuario: 1, idCurso: 1, fechaInscripcion: "2026-06-02T10:00:00.000Z", estado: "Activa" },
]);

// Asistencias previas de Ana en Piano esencial: 11 de 12 sesiones (Figura 22)
const asistenciasPrevias: Asistencia[] = Array.from({ length: 12 }, (_, i) => ({
  idAsistencia: i + 1,
  idInscripcion: 1,
  fecha: new Date(Date.UTC(2026, 8, 1 + i * 7)).toISOString().slice(0, 10),
  estadoAsistencia: i === 4 ? "Ausente" : "Presente",
}));

function leer(clave: string): string {
  try {
    return localStorage.getItem(clave) ?? "[]";
  } catch {
    return "[]";
  }
}

function avisar() {
  oyentes.forEach((f) => f());
}

// Lecturas para useSyncExternalStore: devuelven el texto guardado
export const leerGuardadas = () => leer(CLAVE_INSCRIPCIONES);
export const leerAsistenciasGuardadas = () => leer(CLAVE_ASISTENCIAS);

export function suscribirInscripciones(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

export function todasLasInscripciones(guardadas: string): Inscripcion[] {
  return [...previas, ...(JSON.parse(guardadas) as Inscripcion[])];
}

export function todasLasAsistencias(guardadas: string): Asistencia[] {
  return [...asistenciasPrevias, ...(JSON.parse(guardadas) as Asistencia[])];
}

export function cuposDisponibles(idCurso: number, inscripciones: Inscripcion[]) {
  const curso = cursos.find((c) => c.idCurso === idCurso);
  if (!curso) return 0;
  const ocupados = inscripciones.filter((i) => i.idCurso === idCurso && i.estado === "Activa").length;
  return Math.max(curso.cupoMaximo - ocupados, 0);
}

// RF-37: inscripción con validación de curso abierto, cupos y duplicados
export function inscribir(idUsuario: number, idCurso: number): Resultado {
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
    localStorage.setItem(CLAVE_INSCRIPCIONES, JSON.stringify([...guardadas, nueva]));
  } catch {}
  avisar();
  return { ok: true };
}

// RF-42: registra la asistencia de una sesión. Solo el profesor asignado, solo
// estudiantes con inscripción activa en el curso y sin repetir curso + estudiante + fecha.
export function registrarAsistencias(
  idProfesor: number,
  idCurso: number,
  fecha: string,
  registros: { idInscripcion: number; estadoAsistencia: Asistencia["estadoAsistencia"] }[]
): Resultado {
  const curso = cursos.find((c) => c.idCurso === idCurso);
  if (!curso || curso.idProfesor !== idProfesor) return { ok: false, error: "No tienes asignado este curso." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "Selecciona la fecha de la sesión." };
  if (registros.length === 0) return { ok: false, error: "El curso no tiene estudiantes inscritos." };

  const inscripciones = todasLasInscripciones(leerGuardadas());
  const validas = registros.every((r) =>
    inscripciones.some((i) => i.idInscripcion === r.idInscripcion && i.idCurso === idCurso && i.estado === "Activa")
  );
  if (!validas) return { ok: false, error: "Hay estudiantes que no están inscritos en este curso." };

  const guardadas = JSON.parse(leerAsistenciasGuardadas()) as Asistencia[];
  const todas = [...asistenciasPrevias, ...guardadas];
  if (registros.some((r) => todas.some((a) => a.idInscripcion === r.idInscripcion && a.fecha === fecha))) {
    return { ok: false, error: "La asistencia de esa fecha ya fue registrada." };
  }

  const nuevas: Asistencia[] = registros.map((r, i) => ({
    idAsistencia: Date.now() + i,
    idInscripcion: r.idInscripcion,
    fecha,
    estadoAsistencia: r.estadoAsistencia,
  }));
  try {
    localStorage.setItem(CLAVE_ASISTENCIAS, JSON.stringify([...guardadas, ...nuevas]));
  } catch {}
  avisar();
  return { ok: true };
}