"use client";

import { useConsultaApi } from "@/lib/consulta-api";
import type { EjecucionDetalle, ErrorETL } from "@/modules/etl/schema";

// Historial de ejecuciones ETL y sus errores (GET /api/etl)
export function useImportaciones() {
  return useConsultaApi<{ ejecuciones: EjecucionDetalle[]; errores: ErrorETL[] }>("/api/etl", { ejecuciones: [], errores: [] });
}
