"use client";

import { useCallback, useEffect, useState } from "react";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import type { Inscripcion } from "@/modules/academia/schema";

// Comparte un aviso ligero cuando una inscripción se registra en el navegador.
const EVENTO = "intervallum-inscripciones-actualizadas";
export function avisarInscripcionesActualizadas() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

export function useInscripciones(): Inscripcion[] {
  const { sesion, cargando: cargandoSesion } = useSesion();
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const idUsuario = sesion?.usuario.idUsuario;

  const recargar = useCallback(async () => {
    if (idUsuario === undefined) {
      setInscripciones([]);
      return;
    }
    try {
      const respuesta = await fetch("/api/inscripciones", { cache: "no-store" });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok || !Array.isArray(resultado.dato)) {
        setInscripciones([]);
        return;
      }
      setInscripciones(resultado.dato as Inscripcion[]);
    } catch {
      setInscripciones([]);
    }
  }, [idUsuario]);

  useEffect(() => {
    if (cargandoSesion) return;
    void recargar();
    window.addEventListener(EVENTO, recargar);
    return () => window.removeEventListener(EVENTO, recargar);
  }, [cargandoSesion, recargar]);

  return inscripciones;
}
