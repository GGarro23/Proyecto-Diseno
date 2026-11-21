"use client";

import { useMemo, useSyncExternalStore } from "react";
import { leerEstadoPermisos, permisosDesde, suscribirPermisos } from "@/mocks/permisos";

// Matriz de permisos por rol; se actualiza al guardar cambios
export function usePermisos() {
  const estado = useSyncExternalStore(suscribirPermisos, leerEstadoPermisos, () => "");
  return useMemo(() => permisosDesde(estado), [estado]);
}