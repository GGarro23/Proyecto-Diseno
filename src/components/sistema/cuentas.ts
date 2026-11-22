"use client";

import { useConsultaApi } from "@/lib/consulta-api";
import type { Cuenta } from "@/modules/autenticacion-usuarios/schema";

// Cuentas de usuario con sus roles (GET /api/cuentas)
export function useCuentas() {
  return useConsultaApi<Cuenta[]>("/api/cuentas", []);
}
