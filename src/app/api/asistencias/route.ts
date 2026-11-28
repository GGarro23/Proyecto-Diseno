import { consulta, transaccion } from "@/lib/db";
import { ErrorApi, exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { requerirPermiso, requerirSesion } from "@/modules/autenticacion-usuarios/service";
import type { Asistencia, DiaSemana } from "@/modules/academia/schema";
import { DIAS_SEMANA, validarFechaAsistencia } from "@/modules/academia/validaciones";

function hoyEnCostaRica(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(new Date());
}

type Cuerpo = {
  idCurso?: unknown;
  fecha?: unknown;
  registros?: { idInscripcion?: unknown; estadoAsistencia?: unknown }[];
};

function idValido(valor: unknown): number {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ErrorApi(400, "Identificador inválido.");
  return id;
}

function fechaValida(valor: unknown): string {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ErrorApi(400, "La fecha debe tener formato AAAA-MM-DD.");
  }
  const fecha = new Date(`${valor}T00:00:00Z`);
  if (!Number.isFinite(fecha.valueOf()) || fecha.toISOString().slice(0, 10) !== valor) {
    throw new ErrorApi(400, "La fecha de la sesión no es válida.");
  }
  return valor;
}

export function GET() {
  return manejar(async () => {
    const sesion = await requerirSesion();
    const idUsuario = sesion.usuario.idUsuario;
    const administrador = sesion.roles.includes("Administrador") || sesion.roles.includes("Administrador del sistema");
    const condicion = administrador
      ? "TRUE"
      : `i.id_usuario = $1 OR EXISTS (
          SELECT 1 FROM curso c WHERE c.id_curso = i.id_curso
          AND c.id_profesor = $1 AND $2::boolean
        )`;
    const parametros = administrador ? [] : [idUsuario, sesion.roles.includes("Profesor")];
    const datos = await consulta<Asistencia>(
      `SELECT a.id_asistencia AS "idAsistencia",
              a.id_inscripcion AS "idInscripcion",
              a.fecha::text AS fecha,
              CASE WHEN a.estado_asistencia = 'PRESENTE' THEN 'Presente'
                   ELSE 'Ausente' END AS "estadoAsistencia"
       FROM asistencia a
       JOIN inscripcion i ON i.id_inscripcion = a.id_inscripcion
       WHERE ${condicion}
       ORDER BY a.fecha DESC, a.id_asistencia`, parametros
    );
    return exito(datos);
  });
}

export function POST(peticion: Request) {
  return manejar(async () => {
    const sesion = await requerirPermiso("asistencias.registrar");
    const cuerpo = await leerCuerpo<Cuerpo>(peticion);
    const idCurso = idValido(cuerpo.idCurso);
    const fecha = fechaValida(cuerpo.fecha);
    if (!Array.isArray(cuerpo.registros) || cuerpo.registros.length === 0) {
      throw new ErrorApi(400, "Selecciona al menos un estudiante inscrito.");
    }
    if (cuerpo.registros.length > 300) throw new ErrorApi(400, "Demasiados registros en una solicitud.");
    const registros = cuerpo.registros.map((r) => {
      const idInscripcion = idValido(r.idInscripcion);
      if (r.estadoAsistencia !== "Presente" && r.estadoAsistencia !== "Ausente") {
        throw new ErrorApi(400, "Estado de asistencia inválido.");
      }
      return { idInscripcion, estado: r.estadoAsistencia === "Presente" ? "PRESENTE" : "AUSENTE" };
    });
    if (new Set(registros.map((r) => r.idInscripcion)).size !== registros.length) {
      throw new ErrorApi(400, "Hay estudiantes duplicados en la solicitud.");
    }
    try {
      const creadas = await transaccion(async (cliente) => {
        const curso = await cliente.query<{ id_profesor: number | null }>(
          "SELECT id_profesor FROM curso WHERE id_curso = $1 FOR UPDATE", [idCurso]
        );
        if (!curso.rows[0]) throw new ErrorApi(404, "El curso no existe.");
        if (Number(curso.rows[0].id_profesor) !== sesion.usuario.idUsuario) {
          throw new ErrorApi(403, "No tienes asignado este curso.");
        }

        const horarios = await cliente.query<{ dia_semana: number }>(
          "SELECT DISTINCT dia_semana FROM horario WHERE id_curso = $1 ORDER BY dia_semana", [idCurso]
        );
        const dias = horarios.rows.map((h) => DIAS_SEMANA[Number(h.dia_semana) - 1]) as DiaSemana[];
        const errorFecha = validarFechaAsistencia(fecha, dias, hoyEnCostaRica());
        if (errorFecha) throw new ErrorApi(400, errorFecha);

        const inscritas = await cliente.query<{ id_inscripcion: number }>(
          `SELECT id_inscripcion FROM inscripcion
           WHERE id_curso = $1 AND estado = 'CONFIRMADA' FOR UPDATE`, [idCurso]
        );
        const permitidas = new Set(inscritas.rows.map((i) => Number(i.id_inscripcion)));
        if (registros.some((r) => !permitidas.has(r.idInscripcion))) {
          throw new ErrorApi(409, "Hay estudiantes sin inscripción confirmada en este curso.");
        }

        const insertadas: Asistencia[] = [];
        for (const r of registros) {
          const resultado = await cliente.query<{ id_asistencia: number }>(
            `INSERT INTO asistencia (id_inscripcion, fecha, estado_asistencia)
             VALUES ($1, $2::date, $3) RETURNING id_asistencia`,
            [r.idInscripcion, fecha, r.estado]
          );
          insertadas.push({
            idAsistencia: Number(resultado.rows[0].id_asistencia),
            idInscripcion: r.idInscripcion,
            fecha,
            estadoAsistencia: r.estado === "PRESENTE" ? "Presente" : "Ausente",
          });
        }
        return insertadas;
      });
      return exito(creadas, 201);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "23505") throw new ErrorApi(409, "La asistencia para esta fecha ya está registrada.");
        if (error.code === "23503") throw new ErrorApi(409, "No existe una inscripción indicada.");
        if (error.code === "P0001") throw new ErrorApi(409, "La inscripción no está confirmada.");
      }
      throw error;
    }
  });
}
