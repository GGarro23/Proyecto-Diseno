"use client";

import { useMemo, useSyncExternalStore } from "react";
import { leerGuardadas, suscribirInscripciones, todasLasInscripciones } from "@/mocks/academia";

// Inscripciones actuales (las previas más las hechas en este navegador)
export function useInscripciones() {
  const guardadas = useSyncExternalStore(suscribirInscripciones, leerGuardadas, () => "[]");
  return useMemo(() => todasLasInscripciones(guardadas), [guardadas]);
}