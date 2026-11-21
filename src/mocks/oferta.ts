import type { Curso, Horario } from "@/modules/academia/schema";
import {
  validarAsignacion,
  validarCurso,
  validarHorario,
  type DatosCurso,
  type DatosHorario,
  type ErroresCurso,
} from "@/modules/academia/validaciones";
import { leerGuardadas, todasLasInscripciones } from "./academia";
import { cursos as cursosIniciales, horarios as horariosIniciales } from "./cursos";
import { profesores } from "./usuarios";

// Dato temporal de la oferta académica para administración (RF-30 a RF-34).
// Con el backend, estas funciones pasan a ser llamadas a la API sobre Curso y Horario.

type Resultado<T> = { ok: true; dato: T } | { ok: false; error: string };
type Oferta = { cursos: Curso[]; horarios: Horario[] };

const CLAVE_CURSOS = "intervallum-cursos";
const CLAVE_HORARIOS = "intervallum-horarios";
const oyentes = new Set<() => void>();

function avisar() {
  oyentes.forEach((f) => f());
}

export function suscribirOferta(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

// Para useSyncExternalStore: texto con los cursos y horarios guardados
export function leerEstadoOferta(): string {
  try {
    return JSON.stringify([localStorage.getItem(CLAVE_CURSOS), localStorage.getItem(CLAVE_HORARIOS)]);
  } catch {
    return "[null,null]";
  }
}

export function ofertaDesde(estado: string): Oferta {
  const [cursos, horarios] = JSON.parse(estado) as (string | null)[];
  return {
    cursos: cursos ? JSON.parse(cursos) : cursosIniciales,
    horarios: horarios ? JSON.parse(horarios) : horariosIniciales,
  };
}

function leerOferta(): Oferta {
  return ofertaDesde(leerEstadoOferta());
}

function guardar(cambios: Partial<Oferta>) {
  try {
    if (cambios.cursos) localStorage.setItem(CLAVE_CURSOS, JSON.stringify(cambios.cursos));
    if (cambios.horarios) localStorage.setItem(CLAVE_HORARIOS, JSON.stringify(cambios.horarios));
  } catch {}
  avisar();
}

const siguienteId = (ids: number[]) => Math.max(0, ...ids) + 1;

function inscritosVigentes(idCurso: number) {
  return todasLasInscripciones(leerGuardadas()).filter((i) => i.idCurso === idCurso && i.estado === "Activa").length;
}

function datosLimpios(datos: DatosCurso) {
  return {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    cupoMaximo: Number(datos.cupoMaximo),
    estado: datos.estado,
    imagenUrl: datos.imagenUrl.trim(),
  };
}

type ResultadoCurso = { ok: true; dato: Curso } | { ok: false; errores: ErroresCurso; error?: string };

// RF-30: el curso nace sin profesor; se asigna con RF-34
export function registrarCurso(datos: DatosCurso): ResultadoCurso {
  const errores = validarCurso(datos);
  if (Object.keys(errores).length > 0) return { ok: false, errores };
  const { cursos } = leerOferta();
  const curso: Curso = { idCurso: siguienteId(cursos.map((c) => c.idCurso)), ...datosLimpios(datos), idProfesor: null };
  guardar({ cursos: [...cursos, curso] });
  return { ok: true, dato: curso };
}

// RF-31
export function modificarCurso(idCurso: number, datos: DatosCurso): ResultadoCurso {
  const { cursos } = leerOferta();
  const curso = cursos.find((c) => c.idCurso === idCurso);
  if (!curso) return { ok: false, errores: {}, error: "El curso no existe." };
  const errores = validarCurso(datos, inscritosVigentes(idCurso));
  if (Object.keys(errores).length > 0) return { ok: false, errores };
  Object.assign(curso, datosLimpios(datos));
  guardar({ cursos });
  return { ok: true, dato: curso };
}

// RF-32
export function registrarHorario(idCurso: number, datos: DatosHorario): Resultado<Horario> {
  const { cursos, horarios } = leerOferta();
  const error = validarHorario(datos, idCurso, cursos, horarios);
  if (error) return { ok: false, error };
  const horario: Horario = { idHorario: siguienteId(horarios.map((h) => h.idHorario)), idCurso, ...datos };
  guardar({ horarios: [...horarios, horario] });
  return { ok: true, dato: horario };
}

// RF-33: si se rechaza, el horario anterior queda igual
export function modificarHorario(idHorario: number, datos: DatosHorario): Resultado<Horario> {
  const { cursos, horarios } = leerOferta();
  const horario = horarios.find((h) => h.idHorario === idHorario);
  if (!horario) return { ok: false, error: "El horario no existe." };
  const error = validarHorario(datos, horario.idCurso, cursos, horarios, idHorario);
  if (error) return { ok: false, error };
  Object.assign(horario, datos);
  guardar({ horarios });
  return { ok: true, dato: horario };
}

// RF-34: solo profesores existentes y sin choques de horario con sus otros cursos
export function asignarProfesor(idCurso: number, idProfesor: number): Resultado<Curso> {
  const { cursos, horarios } = leerOferta();
  const curso = cursos.find((c) => c.idCurso === idCurso);
  if (!curso) return { ok: false, error: "El curso no existe." };
  if (!profesores.some((p) => p.idUsuario === idProfesor && p.activo)) return { ok: false, error: "El profesor no existe." };
  const error = validarAsignacion(idCurso, idProfesor, cursos, horarios);
  if (error) return { ok: false, error };
  curso.idProfesor = idProfesor;
  guardar({ cursos });
  return { ok: true, dato: curso };
}