import { consulta } from "@/lib/db";
import { ErrorApi, exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";
import { DIAS_SEMANA, validarIntervalo } from "@/modules/academia/validaciones";
import type { DiaSemana } from "@/modules/academia/schema";

type Datos = { idCurso?: unknown; idHorario?: unknown; diaSemana?: unknown; horaInicio?: unknown; horaFin?: unknown };

function id(valor: unknown) {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero <= 0) throw new ErrorApi(400, "Identificador inválido.");
  return numero;
}

function datosValidos(cuerpo: Datos) {
  const datos = {
    diaSemana: String(cuerpo.diaSemana) as DiaSemana,
    horaInicio: typeof cuerpo.horaInicio === "string" ? cuerpo.horaInicio.trim() : "",
    horaFin: typeof cuerpo.horaFin === "string" ? cuerpo.horaFin.trim() : "",
  };
  const error = validarIntervalo(datos);
  if (error) throw new ErrorApi(400, error);
  return { dia: DIAS_SEMANA.indexOf(datos.diaSemana) + 1, inicio: datos.horaInicio, fin: datos.horaFin };
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
