// AF-05 Academia

export type Curso = {
  idCurso: number;
  nombre: string;
  descripcion: string;
  cupoMaximo: number;
  estado: "Abierto" | "Cerrado"; // "sin cupos" se calcula con las inscripciones
  idProfesor: number | null; // se registra sin profesor y se asigna con RF-34
  imagenUrl: string; // no está en el modelo (Figuras 17 y 19)
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
  horaInicio: string; // "HH:MM"
  horaFin: string;    // "HH:MM"
};

export type Inscripcion = {
  idInscripcion: number;
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