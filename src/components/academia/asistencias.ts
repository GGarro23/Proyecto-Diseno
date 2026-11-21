"use client";

import { useMemo, useSyncExternalStore } from "react";
import { leerAsistenciasGuardadas, suscribirInscripciones, todasLasAsistencias } from "@/mocks/academia";

// Asistencias actuales (las previas más las registradas en este navegador)
export function useAsistencias() {
  const guardadas = useSyncExternalStore(suscribirInscripciones, leerAsistenciasGuardadas, () => "[]");
  return useMemo(() => todasLasAsistencias(guardadas), [guardadas]);
}