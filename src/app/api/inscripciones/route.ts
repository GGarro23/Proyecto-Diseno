import { consulta } from "@/lib/db";
import { ErrorApi, exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { requerirSesion } from "@/modules/autenticacion-usuarios/service";

type Solicitud = { idCurso?: unknown };
type FilaInscripcion = {
  idInscripcion: number;
  nombreEstudiante: string;
  idUsuario: number;
  idCurso: number;
  fechaInscripcion: string;
  estado: "Activa" | "Finalizada";
};

function traducirError(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "23505") {
      throw new ErrorApi(409, "Ya tienes una inscripción registrada en este curso.");
    }
    if (error.code === "23503") throw new ErrorApi(404, "El curso no existe.");
    if (error.code === "P0001") {
      throw new ErrorApi(409, "No es posible inscribirse: el curso está cerrado, no tiene cupos disponibles o tu cuenta no cumple los requisitos.");
    }
  }
  throw error;
}

const CAMPOS = `SELECT i.id_inscripcion AS "idInscripcion",
 u.nombre AS "nombreEstudiante",
 i.id_usuario AS "idUsuario", i.id_curso AS "idCurso",
 i.fecha_inscripcion::text AS "fechaInscripcion",
 CASE WHEN i.estado = 'CONFIRMADA' THEN 'Activa' ELSE 'Finalizada' END AS estado
 FROM inscripcion i JOIN usuario u ON u.id_usuario = i.id_usuario`;

// La sesión determina qué registros se pueden consultar; nunca el idUsuario enviado por el cliente.
export function GET() {
  return manejar(async () => {
    const sesion = await requerirSesion();
    const idUsuario = sesion.usuario.idUsuario;
    let condicion = "WHERE i.id_usuario = $1";
    // Administradores: ver la ocupación general; profesores: solo sus cursos.
    if (sesion.roles.includes("Administrador") || sesion.roles.includes("Administrador del sistema")) {
      condicion = "WHERE $1::bigint > 0";
    } else if (sesion.roles.includes("Profesor")) {
      condicion = `WHERE i.id_usuario = $1
        OR EXISTS (SELECT 1 FROM curso c WHERE c.id_curso = i.id_curso AND c.id_profesor = $1)`;
    }
    const inscripciones = await consulta<FilaInscripcion>(
      `${CAMPOS} ${condicion} ORDER BY i.fecha_inscripcion DESC, i.id_inscripcion DESC`,
      [idUsuario]
    );
    return exito(inscripciones);
  });
}

// RF-37: la BD bloquea el curso, valida cupos/estado, evita duplicados y asigna rol Estudiante.
export function POST(peticion: Request) {
  return manejar(async () => {
    const sesion = await requerirSesion();
    const cuerpo = await leerCuerpo<Solicitud>(peticion);
    const idCurso = Number(cuerpo.idCurso);
    if (!Number.isSafeInteger(idCurso) || idCurso <= 0) {
      throw new ErrorApi(400, "Selecciona un curso válido.");
    }
    try {
      const inscripcion = await consulta<{ idInscripcion: number }>(
        `SELECT inscribir_en_curso($1, $2) AS "idInscripcion"`,
        [sesion.usuario.idUsuario, idCurso]
      );
      return exito({ idInscripcion: Number(inscripcion[0].idInscripcion), idCurso }, 201);
    } catch (error) {
      traducirError(error);
    }
  });
}
