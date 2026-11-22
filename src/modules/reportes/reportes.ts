import type { Curso, Inscripcion } from "@/modules/academia/schema";

export const MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export function ocupacionCurso(curso: Curso, inscripciones: Inscripcion[]) {
  const inscritos = inscripciones.filter((i) => i.idCurso === curso.idCurso && i.estado === "Activa").length;
  return { inscritos, porcentaje: Math.round((inscritos / curso.cupoMaximo) * 100) };
}
