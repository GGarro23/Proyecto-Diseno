import { consulta } from "@/lib/db";
import { ErrorApi, exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";

type Solicitud = { idCurso?: unknown; idProfesor?: unknown };
function id(valor: unknown) {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero <= 0) throw new ErrorApi(400, "Identificador inválido.");
  return numero;
}

// RF-34: lista real de profesores activos, solo para administración académica.
export function GET() {
  return manejar(async () => {
    await requerirPermiso("academia.administrar");
    const profesores = await consulta<{ idUsuario: number; nombre: string }>(
      `SELECT DISTINCT u.id_usuario AS "idUsuario", u.nombre
       FROM usuario u
       JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       JOIN rol r ON r.id_rol = ur.id_rol
       WHERE u.activo = TRUE AND lower(r.nombre) = lower('Profesor')
       ORDER BY u.nombre`
    );
    return exito(profesores);
  });
}

// Los triggers comprueban rol, cuenta activa y choques con horarios existentes.
export function PUT(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("academia.administrar");
    const cuerpo = await leerCuerpo<Solicitud>(peticion);
    const idCurso = id(cuerpo.idCurso);
    const idProfesor = id(cuerpo.idProfesor);
    try {
      const filas = await consulta<{ id_curso: number }>(
        `UPDATE curso SET id_profesor = $2 WHERE id_curso = $1 RETURNING id_curso`,
        [idCurso, idProfesor]
      );
      if (!filas[0]) throw new ErrorApi(404, "El curso no existe.");
      return exito({ idCurso, idProfesor });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error &&
          (error.code === "P0001" || error.code === "23503")) {
        throw new ErrorApi(409, "El usuario no es un profesor activo o tiene horarios incompatibles.");
      }
      throw error;
    }
  });
}
