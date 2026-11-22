"use client";

import { useConsultaApi } from "@/lib/consulta-api";
import type { MatrizPermisos } from "@/modules/autenticacion-usuarios/permisos";

// Matriz de permisos por rol (GET /api/permisos)
export function usePermisos() {
  return useConsultaApi<MatrizPermisos>("/api/permisos", {});
}
