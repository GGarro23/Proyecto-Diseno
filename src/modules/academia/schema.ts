export type Curso = {
  idCurso: number;
  nombre: string;
  descripcion: string;
  cupoMaximo: number;
  estado: "Abierto" | "Cerrado";
  idProfesor: number | null;
  imagenUrl: string;
};

export type DiaSemana =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado"
  | "Domingo";

export type Horario = {
  idHorario: number;
  idCurso: number;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
};

export type Inscripcion = {
  idInscripcion: number;
  nombreEstudiante?: string;
  idUsuario: number;
  idCurso: number;
  fechaInscripcion: string;
  estado: "Activa" | "Finalizada";
};

export type Asistencia = {
  idAsistencia: number;
  idInscripcion: number;
  fecha: string;
  estadoAsistencia: "Presente" | "Ausente";
};