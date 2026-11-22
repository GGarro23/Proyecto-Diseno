import { transaccion } from "@/lib/db";
import { ErrorApi } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";
import * as repositorio from "./repository";
import { cursosParaPromocionar, productosParaReabastecer } from "./reglas";
import type { Recomendacion, RecomendacionDetalle } from "./schema";

// Agente de apoyo a la gestión (AF-07, FA-01 a FA-04). Solo el Administrador lo usa (permiso agente.usar).
// Evalúa los criterios de reglas.ts y guarda recomendaciones; no modifica inventario, pedidos,
// cursos ni inscripciones (Restricciones 5 y 6).

const PERMISO = "agente.usar";

// RF-47
export async function consultar(): Promise<RecomendacionDetalle[]> {
  await requerirPermiso(PERMISO);
  return repositorio.listar();
}

// RF-45 (Reabastecimiento) y RF-46 (Promoción académica). Devuelve cuántas se crearon.
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
    // RNF-09: un fallo del agente se informa sin afectar el resto del sistema
    console.error(error);
    throw new ErrorApi(500, "El agente no pudo generar las recomendaciones. Intenta de nuevo.");
  }
}

// RF-48
export async function marcarRevisada(idRecomendacion: number): Promise<RecomendacionDetalle> {
  const sesion = await requerirPermiso(PERMISO);
  if (!Number.isInteger(idRecomendacion)) throw new ErrorApi(400, "Recomendación inválida.");
  const actual = await repositorio.buscar(idRecomendacion);
  if (!actual) throw new ErrorApi(404, "La recomendación no existe.");
  if (actual.estado === "Revisada") throw new ErrorApi(409, "Esta recomendación ya fue revisada.");
  if (!(await repositorio.marcarRevisada(idRecomendacion, sesion.usuario.idUsuario))) {
    throw new ErrorApi(409, "Esta recomendación ya fue revisada.");
  }
  return (await repositorio.buscar(idRecomendacion))!;
}
