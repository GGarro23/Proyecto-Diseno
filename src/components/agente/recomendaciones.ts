"use client";

import { useConsultaApi } from "@/lib/consulta-api";
import type { RecomendacionDetalle } from "@/modules/agente-apoyo/schema";

export function useRecomendaciones() {
  return useConsultaApi<RecomendacionDetalle[]>("/api/recomendaciones", []);
}
