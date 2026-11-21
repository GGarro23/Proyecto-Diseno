"use client";

import { useMemo, useSyncExternalStore } from "react";
import { leerEstadoPedidos, pedidosDesde, suscribirPedidos } from "@/mocks/compra-simulada";

// Pedidos e historial de estados actuales; se actualizan al avanzar un estado
export function usePedidos() {
  const estado = useSyncExternalStore(suscribirPedidos, leerEstadoPedidos, () => "[null,null]");
  return useMemo(() => pedidosDesde(estado), [estado]);
}