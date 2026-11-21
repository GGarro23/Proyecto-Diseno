"use client";

import { useMemo, useSyncExternalStore } from "react";
import { etlDesde, leerEstadoEtl, suscribirEtl } from "@/mocks/etl";

// Ejecuciones ETL y sus errores; se actualizan con cada importación
export function useImportaciones() {
  const estado = useSyncExternalStore(suscribirEtl, leerEstadoEtl, () => "[null,null]");
  return useMemo(() => etlDesde(estado), [estado]);
}