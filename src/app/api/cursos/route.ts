import { NextResponse } from "next/server";
import { consulta } from "@/lib/db";
import { ErrorApi, exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";
import { obtenerOfertaAcademica } from "@/modules/academia/consultas";
import { validarCurso, type DatosCurso } from "@/modules/academia/validaciones";

type CuerpoCurso = Partial<DatosCurso> & { idCurso?: unknown };

function limpiarCurso(datos: CuerpoCurso): DatosCurso {
  return {
    nombre: typeof datos.nombre === "string" ? datos.nombre.trim() : "",
    descripcion: typeof datos.descripcion === "string" ? datos.descripcion.trim() : "",
    cupoMaximo: typeof datos.cupoMaximo === "string" ? datos.cupoMaximo : "",
    estado: datos.estado === "Cerrado" ? "Cerrado" : "Abierto",
    imagenUrl: typeof datos.imagenUrl === "string" ? datos.imagenUrl.trim() : "",
  };
}

function comprobar(datos: CuerpoCurso) {
  if (datos.estado !== "Abierto" && datos.estado !== "Cerrado") {
    throw new ErrorApi(400, "Estado de curso inválido.");
  }
  const limpios = limpiarCurso(datos);
  const errores = validarCurso(limpios);
  if (Object.keys(errores).length) throw new ErrorApi(400, "Revisa los datos del curso.", errores);
  if (limpios.nombre.length > 180 || limpios.imagenUrl.length > 500) {
    throw new ErrorApi(400, "El nombre o la ruta de imagen superan la longitud permitida.");
  }
  return limpios;
}

function comprobarId(valor: unknown) {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ErrorApi(400, "Identificador de curso inválido.");
  return id;
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

// Mantiene el formato público existente para no romper los consumidores de GET /api/cursos.
export async function GET() {
  try {
    return NextResponse.json(await obtenerOfertaAcademica());
  } catch (error) {
    console.error("Error consultando la oferta académica:", error);
    return NextResponse.json({ error: "No fue posible consultar los cursos" }, { status: 500 });
  }
}

// RF-30. El nuevo curso siempre se registra sin profesor.
export function POST(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("academia.administrar");
    const datos = comprobar(await leerCuerpo<CuerpoCurso>(peticion));
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

// RF-31. El trigger de PostgreSQL protege el cupo frente a inscripciones vigentes.
export function PUT(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("academia.administrar");
    const cuerpo = await leerCuerpo<CuerpoCurso>(peticion);
    const idCurso = comprobarId(cuerpo.idCurso);
    const datos = comprobar(cuerpo);
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
