"use client";

import { useConsultaApi } from "@/lib/consulta-api";
import type { RecomendacionDetalle } from "@/modules/agente-apoyo/schema";

// Recomendaciones del agente con su producto o curso y revisor (GET /api/recomendaciones)
export function useRecomendaciones() {
  return useConsultaApi<RecomendacionDetalle[]>("/api/recomendaciones", []);
}
