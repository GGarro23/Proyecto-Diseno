
import { exito, manejar } from "@/lib/respuesta";

import {
  consultarReporteInventario,
} from "@/modules/reportes/service";

/**
 * GET /api/reportes/inventario
 *
 * Consulta el inventario y sus estadísticas.
 * Acceso exclusivo para Administrador.
 */
export function GET() {
  return manejar(async () => {
    const reporte = await consultarReporteInventario();

    return exito(reporte);
  });
}
