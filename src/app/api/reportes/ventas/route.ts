import { connection } from "next/server";
import {
  ErrorApi,
  exito,
  manejar,
} from "@/lib/respuesta";

import {
  consultarReporteVentas,
} from "@/modules/reportes/service";

/**
 * GET /api/reportes/ventas
 *
 * Consulta las ventas confirmadas entre dos fechas.
 * Acceso exclusivo para Administrador.
 *
 * Ejemplo:
 * /api/reportes/ventas?fechaInicio=2026-11-01&fechaFin=2026-11-30
 */
export async function GET(peticion: Request) {
    await connection();
    return manejar(async () => {
    const url = new URL(peticion.url);

    const fechaInicio = url.searchParams.get("fechaInicio");
    const fechaFin = url.searchParams.get("fechaFin");

    if (!fechaInicio || !fechaFin) {
      throw new ErrorApi(
        400,
        "Debes indicar fechaInicio y fechaFin."
      );
    }

    const reporte = await consultarReporteVentas(
      fechaInicio,
      fechaFin
    );

    return exito(reporte);
  });
}
