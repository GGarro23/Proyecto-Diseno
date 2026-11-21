import type { Curso, DiaSemana, Horario } from "./schema";

// Validaciones de cursos, horarios y asignación de profesores (RF-30 a RF-34).
// Las usa el frontend y debe usarlas el backend.

export type DatosCurso = {
  nombre: string;
  descripcion: string;
  cupoMaximo: string;
  estado: Curso["estado"];
  imagenUrl: string;
};

export type ErroresCurso = Partial<Record<keyof DatosCurso, string>>;

// RF-30 y RF-31: nombre, descripción y cupo entero positivo. Al modificar, el cupo
// no puede quedar por debajo de las inscripciones vigentes.
export function validarCurso(datos: DatosCurso, inscritosVigentes = 0): ErroresCurso {
  const errores: ErroresCurso = {};
  if (!datos.nombre.trim()) errores.nombre = "Indica el nombre del curso.";
  if (!datos.descripcion.trim()) errores.descripcion = "Indica la descripción del curso.";
  const cupo = Number(datos.cupoMaximo);
  if (!datos.cupoMaximo.trim() || !Number.isInteger(cupo) || cupo <= 0) errores.cupoMaximo = "Indica un cupo entero mayor que cero.";
  else if (cupo < inscritosVigentes) {
    errores.cupoMaximo = `El cupo no puede ser menor que las ${inscritosVigentes} inscripciones vigentes.`;
  }
  return errores;
}

export type DatosHorario = { diaSemana: DiaSemana; horaInicio: string; horaFin: string };

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const seCruzan = (a: DatosHorario, b: DatosHorario) =>
  a.diaSemana === b.diaSemana && a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;

const textoHorario = (h: DatosHorario) => `${h.diaSemana} ${h.horaInicio}–${h.horaFin}`;

// Primer horario de otro curso del mismo profesor que choca con alguno de los dados
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

// RF-32 y RF-33: inicio antes del fin y sin choques con el mismo curso ni con otros cursos
// del profesor asignado. idHorario se omite al registrar.
export function validarHorario(
  datos: DatosHorario,
  idCurso: number,
  cursos: Curso[],
  horarios: Horario[],
  idHorario?: number
): string | undefined {
  if (!HORA.test(datos.horaInicio) || !HORA.test(datos.horaFin)) return "Indica las horas en formato HH:MM.";
  if (datos.horaInicio >= datos.horaFin) return "La hora de inicio debe ser anterior a la hora de fin.";
  const curso = cursos.find((c) => c.idCurso === idCurso);
  if (!curso) return "El curso no existe.";
  const resto = horarios.filter((h) => h.idHorario !== idHorario);
  const propio = resto.find((h) => h.idCurso === idCurso && seCruzan(datos, h));
  if (propio) return `Choca con otro horario del mismo curso (${textoHorario(propio)}).`;
  return choqueConProfesor(curso.idProfesor, idCurso, [datos], cursos, resto);
}

// RF-34: el profesor no puede tener otro curso con horarios que se crucen con este
export function validarAsignacion(idCurso: number, idProfesor: number, cursos: Curso[], horarios: Horario[]): string | undefined {
  if (!cursos.some((c) => c.idCurso === idCurso)) return "El curso no existe.";
  const propios = horarios.filter((h) => h.idCurso === idCurso);
  return choqueConProfesor(idProfesor, idCurso, propios, cursos, horarios);
}