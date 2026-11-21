"use client";

import { useConsultaApi } from "@/lib/consulta-api";
import type { MatrizPermisos } from "@/modules/autenticacion-usuarios/permisos";

export function usePermisos() {
  return useConsultaApi<MatrizPermisos>("/api/permisos", {});
}
