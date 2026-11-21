import { connection } from "next/server";
import {
  ErrorApi,
  exito,
  manejar,
} from "@/lib/respuesta";

import {
  consultarReporteVentas,
} from "@/modules/reportes/service";

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
