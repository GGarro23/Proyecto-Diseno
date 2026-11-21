"use client";

import { useConsultaApi } from "@/lib/consulta-api";
import type { Cuenta } from "@/modules/autenticacion-usuarios/schema";

export function useCuentas() {
  return useConsultaApi<Cuenta[]>("/api/cuentas", []);
}
