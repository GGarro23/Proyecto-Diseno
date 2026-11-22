"use client";

import { useCallback, useEffect, useState } from "react";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import type { Asistencia } from "@/modules/academia/schema";

const EVENTO = "intervallum-asistencias-actualizadas";
export function avisarAsistenciasActualizadas() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

export function useAsistencias(): Asistencia[] {
  const { sesion, cargando } = useSesion();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const idUsuario = sesion?.usuario.idUsuario;

  const recargar = useCallback(async () => {
    if (idUsuario === undefined) {
      setAsistencias([]);
      return;
    }
    try {
      const respuesta = await fetch("/api/asistencias", { cache: "no-store" });
      const resultado = await respuesta.json();
      setAsistencias(respuesta.ok && resultado.ok && Array.isArray(resultado.dato)
        ? resultado.dato as Asistencia[] : []);
    } catch {
      setAsistencias([]);
    }
  }, [idUsuario]);

  useEffect(() => {
    if (cargando) return;
    void recargar();
    window.addEventListener(EVENTO, recargar);
    return () => window.removeEventListener(EVENTO, recargar);
  }, [cargando, recargar]);

  return asistencias;
}
