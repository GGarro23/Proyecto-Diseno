import { HORA, entero, espacios, fechaReal, minutos, rutaImagen, texto, type Mensaje } from "@/lib/validacion";
import type { Curso, DiaSemana, Horario } from "./schema";

export const LIMITES_ACADEMIA = {
  nombreCurso: 120,
  descripcionCurso: 1000,
  cupoMaximo: 100,
  duracionMinima: 30,
  duracionMaxima: 240,
  apertura: "06:00",
  cierre: "22:00",
  diasAtras: 365,
};

export const DIAS_SEMANA: DiaSemana[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const comparable = (valor: string) =>
  valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLowerCase();

export type DatosCurso = {
  nombre: string;
  descripcion: string;
  cupoMaximo: string;
  estado: Curso["estado"];
  imagenUrl: string;
};

export type ErroresCurso = Partial<Record<keyof DatosCurso, string>>;

export function validarCurso(
  datos: DatosCurso,
  inscritosVigentes = 0,
  cursos: Pick<Curso, "idCurso" | "nombre">[] = [],
  idCurso?: number
): ErroresCurso {
  const errores: ErroresCurso = {};
  const nombre = espacios(datos.nombre);
  const errorNombre = texto(nombre, "el nombre del curso", { min: 3, max: LIMITES_ACADEMIA.nombreCurso });
  if (errorNombre) errores.nombre = errorNombre;
  else if (cursos.some((c) => c.idCurso !== idCurso && comparable(c.nombre) === comparable(nombre))) {
    errores.nombre = "Ya existe un curso con ese nombre.";
  }
  const errorDescripcion = texto(datos.descripcion, "la descripción del curso", {
    min: 10,
    max: LIMITES_ACADEMIA.descripcionCurso,
  });
  if (errorDescripcion) errores.descripcion = errorDescripcion;
  const errorCupo = entero(datos.cupoMaximo, "el cupo máximo", 1, LIMITES_ACADEMIA.cupoMaximo);
  if (errorCupo) errores.cupoMaximo = errorCupo;
  else if (Number(datos.cupoMaximo) < inscritosVigentes) {
    errores.cupoMaximo = `El cupo no puede ser menor que las ${inscritosVigentes} inscripciones vigentes.`;
  }
  if (datos.estado !== "Abierto" && datos.estado !== "Cerrado") errores.estado = "Selecciona un estado válido.";
  const errorImagen = rutaImagen(datos.imagenUrl);
  if (errorImagen) errores.imagenUrl = errorImagen;
  return errores;
}

export type DatosHorario = { diaSemana: DiaSemana; horaInicio: string; horaFin: string };

const seCruzan = (a: DatosHorario, b: DatosHorario) =>
  a.diaSemana === b.diaSemana && a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;

const textoHorario = (h: DatosHorario) => `${h.diaSemana} ${h.horaInicio}–${h.horaFin}`;

function choqueConProfesor(
  idProfesor: number | null,
  idCurso: number,
  propios: DatosHorario[],
  cursos: Curso[],
  horarios: Horario[]
): string | undefined {
  if (idProfesor === null) return;
  const otrosCursos = cursos.filter((c) => c.idCurso !== idCurso && c.idProfesor === idProfesor);
  for (const otro of otrosCursos) {
    const choque = horarios.find((h) => h.idCurso === otro.idCurso && propios.some((p) => seCruzan(p, h)));
    if (choque) return `Choca con ${otro.nombre} (${textoHorario(choque)}), del mismo profesor.`;
  }
}

export function validarIntervalo(datos: DatosHorario): Mensaje {
  if (!DIAS_SEMANA.includes(datos.diaSemana)) return "Selecciona un día válido.";
  if (!datos.horaInicio || !datos.horaFin) return "Indica la hora de inicio y la de fin.";
  if (!HORA.test(datos.horaInicio) || !HORA.test(datos.horaFin)) return "Indica las horas en formato HH:MM.";
  if (datos.horaInicio >= datos.horaFin) return "La hora de inicio debe ser anterior a la hora de fin.";
  if (datos.horaInicio < LIMITES_ACADEMIA.apertura || datos.horaFin > LIMITES_ACADEMIA.cierre) {
    return `Las clases deben estar entre las ${LIMITES_ACADEMIA.apertura} y las ${LIMITES_ACADEMIA.cierre}.`;
  }
  const duracion = minutos(datos.horaFin) - minutos(datos.horaInicio);
  if (duracion < LIMITES_ACADEMIA.duracionMinima) return `Cada sesión debe durar al menos ${LIMITES_ACADEMIA.duracionMinima} minutos.`;
  if (duracion > LIMITES_ACADEMIA.duracionMaxima) return "Cada sesión puede durar como máximo 4 horas.";
}

export function cruceEnCurso(datos: DatosHorario, idCurso: number, horarios: Horario[], idHorario?: number): Mensaje {
  const propio = horarios.find((h) => h.idCurso === idCurso && h.idHorario !== idHorario && seCruzan(datos, h));
  if (propio) return `Choca con otro horario del mismo curso (${textoHorario(propio)}).`;
}

export function validarHorario(
  datos: DatosHorario,
  idCurso: number,
  cursos: Curso[],
  horarios: Horario[],
  idHorario?: number
): string | undefined {
  const errorIntervalo = validarIntervalo(datos);
  if (errorIntervalo) return errorIntervalo;
  const curso = cursos.find((c) => c.idCurso === idCurso);
  if (!curso) return "El curso no existe.";
  const resto = horarios.filter((h) => h.idHorario !== idHorario);
  const propio = resto.find((h) => h.idCurso === idCurso && seCruzan(datos, h));
  if (propio) return `Choca con otro horario del mismo curso (${textoHorario(propio)}).`;
  return choqueConProfesor(curso.idProfesor, idCurso, [datos], cursos, resto);
}

export function validarAsignacion(idCurso: number, idProfesor: number, cursos: Curso[], horarios: Horario[]): string | undefined {
  if (!cursos.some((c) => c.idCurso === idCurso)) return "El curso no existe.";
  const propios = horarios.filter((h) => h.idCurso === idCurso);
  return choqueConProfesor(idProfesor, idCurso, propios, cursos, horarios);
}

export function diaDeFecha(fecha: string): DiaSemana {
  return DIAS_SEMANA[(new Date(`${fecha}T00:00:00Z`).getUTCDay() + 6) % 7];
}

export function validarFechaAsistencia(fecha: string, dias: DiaSemana[], hoy: string): Mensaje {
  if (!fecha) return "Indica la fecha de la sesión.";
  if (!fechaReal(fecha)) return "La fecha de la sesión no es válida.";
  if (fecha > hoy) return "No puedes registrar asistencia de una fecha futura.";
  const limite = new Date(`${hoy}T00:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() - LIMITES_ACADEMIA.diasAtras);
  if (fecha < limite.toISOString().slice(0, 10)) return "Solo puedes registrar asistencia del último año.";
  if (dias.length === 0) return "El curso no tiene horarios, así que no tiene sesiones para registrar.";
  const dia = diaDeFecha(fecha);
  if (!dias.includes(dia)) {
    const plural = dia.endsWith("s") ? dia : `${dia}s`;
    return `El curso no tiene clase los ${plural.toLowerCase()}. Días de clase: ${dias.join(", ")}.`;
  }
}
