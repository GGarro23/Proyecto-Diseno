"use client";

import { useMemo, useSyncExternalStore } from "react";
import { leerEstadoRecomendaciones, recomendacionesDesde, suscribirRecomendaciones } from "@/mocks/recomendaciones";

// Recomendaciones del agente; se actualizan al generar o revisar
export function useRecomendaciones() {
  const estado = useSyncExternalStore(suscribirRecomendaciones, leerEstadoRecomendaciones, () => "[]");
  return useMemo(() => recomendacionesDesde(estado), [estado]);
}