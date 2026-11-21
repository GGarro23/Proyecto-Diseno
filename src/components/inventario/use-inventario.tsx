"use client";

import { useMemo, useSyncExternalStore } from "react";
import { inventarioDesde, leerEstadoInventario, suscribirInventario } from "@/mocks/inventario-simulado";

// Productos, categorías y movimientos actuales; se actualizan con cada registro
export function useInventario() {
  const estado = useSyncExternalStore(suscribirInventario, leerEstadoInventario, () => "[null,null,null]");
  return useMemo(() => inventarioDesde(estado), [estado]);
}