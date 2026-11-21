"use client";

import { useMemo, useSyncExternalStore } from "react";
import { leerEstadoOferta, ofertaDesde, suscribirOferta } from "@/mocks/oferta";

// Cursos y horarios actuales; se actualizan con cada cambio de administración
export function useOferta() {
  const estado = useSyncExternalStore(suscribirOferta, leerEstadoOferta, () => "[null,null]");
  return useMemo(() => ofertaDesde(estado), [estado]);
}