import { consulta } from "@/lib/db";
import { ErrorApi, exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";

type Datos = { idCurso?: unknown; idHorario?: unknown; diaSemana?: unknown; horaInicio?: unknown; horaFin?: unknown };
const HORA = /^([01]\\d|2[0-3]):[0-5]\\d$/;
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function id(valor: unknown) {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero <= 0) throw new ErrorApi(400, "Identificador inválido.");
  return numero;
}

function datosValidos(cuerpo: Datos) {
  const dia = DIAS.indexOf(String(cuerpo.diaSemana)) + 1;
  if (!dia || typeof cuerpo.horaInicio !== "string" || typeof cuerpo.horaFin !== "string" ||
      !HORA.test(cuerpo.horaInicio) || !HORA.test(cuerpo.horaFin) ||
      cuerpo.horaInicio >= cuerpo.horaFin) {
    throw new ErrorApi(400, "Indica un día y un intervalo horario válido.");
  }
  return { dia, inicio: cuerpo.horaInicio, fin: cuerpo.horaFin };
}

function errorHorario(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P0001" || error.code === "23505" || error.code === "23514") {
      throw new ErrorApi(409, "El horario se cruza con otro del curso o del profesor, o ya está registrado.");
    }
    if (error.code === "23503") throw new ErrorApi(404, "El curso no existe.");
  }
  throw error;
}

// RF-32: PostgreSQL comprueba los solapamientos mediante trigger.
export function POST(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("academia.administrar");
    const cuerpo = await leerCuerpo<Datos>(peticion);
    const idCurso = id(cuerpo.idCurso);
    const datos = datosValidos(cuerpo);
    try {
      const filas = await consulta<{ id_horario: number }>(
        `INSERT INTO horario(id_curso, dia_semana, hora_inicio, hora_fin)
         VALUES ($1, $2, $3, $4) RETURNING id_horario`,
        [idCurso, datos.dia, datos.inicio, datos.fin]
      );
      return exito({ idHorario: Number(filas[0].id_horario) }, 201);
    } catch (error) { errorHorario(error); }
  });
}

// RF-33: conservar el horario anterior si la BD rechaza el nuevo.
export function PUT(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("academia.administrar");
    const cuerpo = await leerCuerpo<Datos>(peticion);
    const idHorario = id(cuerpo.idHorario);
    const datos = datosValidos(cuerpo);
    try {
      const filas = await consulta<{ id_horario: number }>(
        `UPDATE horario SET dia_semana = $2, hora_inicio = $3, hora_fin = $4
         WHERE id_horario = $1 RETURNING id_horario`,
        [idHorario, datos.dia, datos.inicio, datos.fin]
      );
      if (!filas[0]) throw new ErrorApi(404, "El horario no existe.");
      return exito({ idHorario });
    } catch (error) { errorHorario(error); }
  });
}
