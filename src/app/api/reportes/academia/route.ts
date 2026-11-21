
import { exito, manejar } from "@/lib/respuesta";

import {
  consultarReporteAcademia,
} from "@/modules/reportes/service";

/**
 * GET /api/reportes/academia
 *
 * Consulta la ocupación académica de los cursos.
 * Acceso exclusivo para Administrador.
 */
export function GET() {
  return manejar(async () => {
    const reporte = await consultarReporteAcademia();

    return exito(reporte);
  });
}
