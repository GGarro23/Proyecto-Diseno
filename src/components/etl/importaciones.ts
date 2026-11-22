"use client";

import { useConsultaApi } from "@/lib/consulta-api";
import type { EjecucionDetalle, ErrorETL } from "@/modules/etl/schema";

export function useImportaciones() {
  return useConsultaApi<{ ejecuciones: EjecucionDetalle[]; errores: ErrorETL[] }>("/api/etl", { ejecuciones: [], errores: [] });
}
