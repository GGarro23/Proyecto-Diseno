import { connection } from "next/server";
import { exito, manejar } from "@/lib/respuesta";

import {
  consultarReporteAcademia,
} from "@/modules/reportes/service";


export async function GET() {
  await connection();

  return manejar(async () => {
    const reporte = await consultarReporteAcademia();

    return exito(reporte);
  });
}