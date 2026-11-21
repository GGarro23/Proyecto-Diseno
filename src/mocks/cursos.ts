import type { Curso, Horario } from "@/modules/academia/schema";

// Cursos de la Figura 17. El último está cerrado para probar RF-35. Descripciones de prueba.
export const cursos: Curso[] = [
  {
    idCurso: 1,
    nombre: "Piano esencial",
    descripcion: "Bases de técnica, lectura y postura para comenzar a tocar el piano con confianza.",
    cupoMaximo: 8,
    estado: "Abierto",
    idProfesor: 10,
    imagenUrl: "/img/cursos/piano-esencial.jpg",
  },
  {
    idCurso: 2,
    nombre: "Violín de cámara",
    descripcion: "Repertorio para pequeños ensambles, afinación en grupo y escucha activa.",
    cupoMaximo: 6,
    estado: "Abierto",
    idProfesor: 11,
    imagenUrl: "/img/cursos/violin-de-camara.jpg",
  },
  {
    idCurso: 3,
    nombre: "Armonía moderna",
    descripcion: "Acordes, progresiones y análisis aplicados a la música popular y al jazz.",
    cupoMaximo: 10,
    estado: "Abierto",
    idProfesor: 12,
    imagenUrl: "/img/cursos/armonia-moderna.jpg",
  },
  {
    idCurso: 4,
    nombre: "Piano intermedio",
    descripcion: "Repertorio clásico, independencia de manos y uso del pedal.",
    cupoMaximo: 6,
    estado: "Cerrado",
    idProfesor: 10,
    imagenUrl: "/img/cursos/piano-intermedio.jpg",
  },
];

// Horarios de la Figura 17
export const horarios: Horario[] = [
  { idHorario: 1, idCurso: 1, diaSemana: "Martes", horaInicio: "16:00", horaFin: "17:30" },
  { idHorario: 2, idCurso: 2, diaSemana: "Jueves", horaInicio: "17:30", horaFin: "19:00" },
  { idHorario: 3, idCurso: 3, diaSemana: "Sábado", horaInicio: "09:00", horaFin: "11:00" },
  { idHorario: 4, idCurso: 4, diaSemana: "Miércoles", horaInicio: "18:00", horaFin: "19:30" },
];