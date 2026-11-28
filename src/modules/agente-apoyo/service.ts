import { transaccion } from "@/lib/db";
import { ErrorApi } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";
import * as repositorio from "./repository";
import { cursosParaPromocionar, productosParaReabastecer } from "./reglas";
import type { Recomendacion, RecomendacionDetalle } from "./schema";

const PERMISO = "agente.usar";

export async function consultar(): Promise<RecomendacionDetalle[]> {
  await requerirPermiso(PERMISO);
  return repositorio.listar();
}

export async function generar(tipo: Recomendacion["tipo"]): Promise<{ creadas: number }> {
  await requerirPermiso(PERMISO);
  if (tipo !== "Reabastecimiento" && tipo !== "Promoción académica") throw new ErrorApi(400, "Tipo de recomendación inválido.");
  try {
    const actuales = await repositorio.listar();
    const propuestas =
      tipo === "Reabastecimiento"
        ? productosParaReabastecer(await repositorio.productos(), actuales)
        : cursosParaPromocionar(await repositorio.cursos(), await repositorio.inscripciones(), actuales);
    const creadas = await transaccion((cliente) => repositorio.registrar(cliente, tipo, propuestas));
    return { creadas };
  } catch (error) {
    console.error(error);
    throw new ErrorApi(500, "El agente no pudo generar las recomendaciones. Intenta de nuevo.");
  }
}

export async function marcarRevisada(idRecomendacion: number): Promise<RecomendacionDetalle> {
  const sesion = await requerirPermiso(PERMISO);
  if (!Number.isSafeInteger(idRecomendacion) || idRecomendacion <= 0) throw new ErrorApi(400, "Recomendación inválida.");
  const actual = await repositorio.buscar(idRecomendacion);
  if (!actual) throw new ErrorApi(404, "La recomendación no existe.");
  if (actual.estado === "Revisada") throw new ErrorApi(409, "Esta recomendación ya fue revisada.");
  if (!(await repositorio.marcarRevisada(idRecomendacion, sesion.usuario.idUsuario))) {
    throw new ErrorApi(409, "Esta recomendación ya fue revisada.");
  }
  return (await repositorio.buscar(idRecomendacion))!;
}
