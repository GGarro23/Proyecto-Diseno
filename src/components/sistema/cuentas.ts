"use client";

import { useMemo, useSyncExternalStore } from "react";
import { cuentasDesde, leerEstadoSesion, suscribirSesion } from "@/mocks/autenticacion";

// Cuentas de usuario con sus roles; se actualizan al registrar, editar o desactivar
export function useCuentas() {
  const estado = useSyncExternalStore(suscribirSesion, leerEstadoSesion, () => "|");
  return useMemo(() => cuentasDesde(estado), [estado]);
}