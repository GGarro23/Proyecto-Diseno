import { transaccion } from "@/lib/db";
import { ErrorApi } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";
import * as repositorio from "./repository";
import { analizarCsv, estadoEjecucion, type ErrorFila } from "./reglas";
import type { EjecucionDetalle, EjecucionETL, ErrorETL } from "./schema";

// Proceso ETL (AF-08, RF-49, RF-50). Extracción y validación en reglas.ts; carga fila por fila
// con cargar_producto_etl. Toda ejecución queda registrada, también las fallidas.

const PERMISO = "etl.ejecutar";
const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB (Figura 33)

type Resumen = Pick<EjecucionETL, "idEjecucion" | "estado" | "filasAceptadas" | "filasRechazadas">;

// RF-49: el navegador envía el nombre del archivo y su texto ya leído
export async function ejecutar(nombreArchivo: string, contenido: string): Promise<Resumen> {
  const sesion = await requerirPermiso(PERMISO);
  if (!nombreArchivo?.trim() || !nombreArchivo.toLowerCase().endsWith(".csv")) throw new ErrorApi(400, "El archivo debe ser .csv.");
  if (typeof contenido !== "string") throw new ErrorApi(400, "El archivo no tiene contenido.");
  if (Buffer.byteLength(contenido) > TAMANO_MAXIMO) throw new ErrorApi(413, "El archivo supera el máximo de 10 MB.");

  const analisis = analizarCsv(contenido, await repositorio.productos(), await repositorio.categorias());

  return transaccion(async (cliente) => {
    const idEjecucion = await repositorio.crearEjecucion(cliente, sesion.usuario.idUsuario, nombreArchivo.trim());
    let filasAceptadas = 0;
    let filasRechazadas = 0;
    const errores: ErrorFila[] = [...analisis.errores];

    if (analisis.estructuraValida) {
      filasRechazadas = analisis.filasRechazadas;
      for (const fila of analisis.validas) {
        const error = await repositorio.cargarFila(cliente, idEjecucion, fila);
        if (error) {
          filasRechazadas++;
          errores.push(error);
        } else filasAceptadas++;
      }
    }

    const estado = estadoEjecucion(filasAceptadas, filasRechazadas);
    await repositorio.cerrarEjecucion(cliente, idEjecucion, estado, filasAceptadas, filasRechazadas, errores);
    return { idEjecucion, estado, filasAceptadas, filasRechazadas };
  });
}

// RF-50: historial sin volver a procesar los archivos
export async function consultar(): Promise<{ ejecuciones: EjecucionDetalle[]; errores: ErrorETL[] }> {
  await requerirPermiso(PERMISO);
  return { ejecuciones: await repositorio.ejecuciones(), errores: await repositorio.errores() };
}
