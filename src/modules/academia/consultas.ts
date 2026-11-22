
import { db } from "@/lib/db";
import type {
  Curso,
  Horario,
  DiaSemana,
} from "./schema";

type FilaCurso = {
  id_curso: string;
  nombre: string;
  descripcion: string;
  cupo_maximo: number;
  estado: "ABIERTO" | "CERRADO";
  id_profesor: string | null;
  imagen_url: string | null;
  nombre_profesor: string | null;
  cupos_disponibles: number;
};

type FilaHorario = {
  id_horario: string;
  id_curso: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

export type CursoAcademia = {
  curso: Curso;
  horarios: Horario[];
  profesor: string | null;
  cuposDisponibles: number;
};

const DIAS: DiaSemana[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export async function obtenerOfertaAcademica():
  Promise<CursoAcademia[]> {

  const [resultadoCursos, resultadoHorarios] =
    await Promise.all([
      db.query<FilaCurso>(`
        SELECT
          c.id_curso,
          c.nombre,
          c.descripcion,
          c.cupo_maximo,
          c.estado,
          c.id_profesor,
          c.imagen_url,
          u.nombre AS nombre_profesor,
          GREATEST(
            c.cupo_maximo - COALESCE(i.ocupados, 0),
            0
          )::INTEGER AS cupos_disponibles
        FROM curso c
        LEFT JOIN usuario u
          ON u.id_usuario = c.id_profesor
        LEFT JOIN (
          SELECT
            id_curso,
            COUNT(*)::INTEGER AS ocupados
          FROM inscripcion
          WHERE estado = 'CONFIRMADA'
          GROUP BY id_curso
        ) i ON i.id_curso = c.id_curso
        ORDER BY c.id_curso;
      `),

      db.query<FilaHorario>(`
        SELECT
          id_horario,
          id_curso,
          dia_semana,
          hora_inicio,
          hora_fin
        FROM horario
        ORDER BY dia_semana, hora_inicio;
      `),
    ]);

  const horarios: Horario[] =
    resultadoHorarios.rows.map((fila) => ({
      idHorario: Number(fila.id_horario),
      idCurso: Number(fila.id_curso),
      diaSemana: DIAS[Number(fila.dia_semana) - 1],
      horaInicio: fila.hora_inicio.slice(0, 5),
      horaFin: fila.hora_fin.slice(0, 5),
    }));

  return resultadoCursos.rows.map((fila) => {
    const idCurso = Number(fila.id_curso);

    return {
      curso: {
        idCurso,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        cupoMaximo: fila.cupo_maximo,
        estado:
          fila.estado === "ABIERTO"
            ? "Abierto"
            : "Cerrado",
        idProfesor: fila.id_profesor
          ? Number(fila.id_profesor)
          : null,
        imagenUrl: fila.imagen_url ?? "",
      },
      horarios: horarios.filter(
        (h) => h.idCurso === idCurso
      ),
      profesor: fila.nombre_profesor,
      cuposDisponibles: fila.cupos_disponibles,
    };
  });
}

export async function obtenerCursoPorId(
  idCurso: number
): Promise<CursoAcademia | null> {
  const oferta = await obtenerOfertaAcademica();

  return (
    oferta.find(
      (datos) => datos.curso.idCurso === idCurso
    ) ?? null
  );
}
