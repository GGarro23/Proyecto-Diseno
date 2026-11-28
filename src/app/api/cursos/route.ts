import { NextResponse } from "next/server";
import { consulta } from "@/lib/db";
import { ErrorApi, exito, leerCuerpo, leerId, manejar } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";
import { obtenerOfertaAcademica } from "@/modules/academia/consultas";
import { espacios } from "@/lib/validacion";
import { validarCurso, type DatosCurso } from "@/modules/academia/validaciones";

type CuerpoCurso = Partial<DatosCurso> & { idCurso?: unknown };

function limpiarCurso(datos: CuerpoCurso): DatosCurso {
  return {
    nombre: typeof datos.nombre === "string" ? espacios(datos.nombre) : "",
    descripcion: typeof datos.descripcion === "string" ? datos.descripcion.trim() : "",
    cupoMaximo:
      typeof datos.cupoMaximo === "string"
        ? datos.cupoMaximo.trim()
        : typeof datos.cupoMaximo === "number"
          ? String(datos.cupoMaximo)
          : "",
    estado: datos.estado === "Cerrado" ? "Cerrado" : "Abierto",
    imagenUrl: typeof datos.imagenUrl === "string" ? datos.imagenUrl.trim() : "",
  };
}

async function comprobar(datos: CuerpoCurso, idCurso?: number) {
  if (datos.estado !== "Abierto" && datos.estado !== "Cerrado") {
    throw new ErrorApi(400, "Estado de curso inválido.", { estado: "Selecciona un estado válido." });
  }
  const limpios = limpiarCurso(datos);
  const cursos = await consulta<{ idCurso: number; nombre: string; inscritos: number }>(
    `SELECT c.id_curso AS "idCurso", c.nombre,
            (SELECT COUNT(*) FROM inscripcion i WHERE i.id_curso = c.id_curso AND i.estado = 'CONFIRMADA')::int AS inscritos
     FROM curso c`
  );
  if (idCurso !== undefined && !cursos.some((c) => c.idCurso === idCurso)) throw new ErrorApi(404, "El curso no existe.");
  const inscritos = cursos.find((c) => c.idCurso === idCurso)?.inscritos ?? 0;
  const errores = validarCurso(limpios, inscritos, cursos, idCurso);
  if (Object.keys(errores).length) {
    const duplicado = errores.nombre === "Ya existe un curso con ese nombre.";
    throw new ErrorApi(duplicado ? 409 : 400, "Revisa los datos del curso.", errores);
  }
  return limpios;
}

function comprobarId(valor: unknown) {
  return leerId(valor, "Identificador de curso inválido.");
}

function errorBD(error: unknown): never {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "23514" || error.code === "23502" || error.code === "22001") {
      throw new ErrorApi(400, "Los datos del curso incumplen una restricción.");
    }
    if (error.code === "23503") throw new ErrorApi(409, "El curso tiene una referencia inválida.");
    if (error.code === "P0001") throw new ErrorApi(409, "El cupo máximo es inferior a las inscripciones confirmadas.");
  }
  throw error;
}

export async function GET() {
  try {
    return NextResponse.json(await obtenerOfertaAcademica());
  } catch (error) {
    console.error("Error consultando la oferta académica:", error);
    return NextResponse.json({ error: "No fue posible consultar los cursos" }, { status: 500 });
  }
}

export function POST(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("academia.administrar");
    const datos = await comprobar(await leerCuerpo<CuerpoCurso>(peticion));
    try {
      const filas = await consulta<{ id_curso: number }>(
        `INSERT INTO curso (nombre, descripcion, cupo_maximo, estado, imagen_url)
         VALUES ($1, $2, $3, $4, $5) RETURNING id_curso`,
        [datos.nombre, datos.descripcion, Number(datos.cupoMaximo),
         datos.estado === "Abierto" ? "ABIERTO" : "CERRADO", datos.imagenUrl || null]
      );
      return exito({ idCurso: Number(filas[0].id_curso), nombre: datos.nombre }, 201);
    } catch (error) {
      errorBD(error);
    }
  });
}

export function PUT(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("academia.administrar");
    const cuerpo = await leerCuerpo<CuerpoCurso>(peticion);
    const idCurso = comprobarId(cuerpo.idCurso);
    const datos = await comprobar(cuerpo, idCurso);
    try {
      const filas = await consulta<{ id_curso: number }>(
        `UPDATE curso SET nombre = $2, descripcion = $3, cupo_maximo = $4,
          estado = $5, imagen_url = $6
         WHERE id_curso = $1 RETURNING id_curso`,
        [idCurso, datos.nombre, datos.descripcion, Number(datos.cupoMaximo),
         datos.estado === "Abierto" ? "ABIERTO" : "CERRADO", datos.imagenUrl || null]
      );
      if (!filas[0]) throw new ErrorApi(404, "El curso no existe.");
      return exito({ idCurso, nombre: datos.nombre });
    } catch (error) {
      errorBD(error);
    }
  });
}
