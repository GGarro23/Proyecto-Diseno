"use client";

import { useEffect, useState } from "react";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import type { Asistencia } from "@/modules/academia/schema";

const EVENTO = "intervallum-asistencias-actualizadas";
export function avisarAsistenciasActualizadas() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

async function pedirAsistencias(): Promise<Asistencia[]> {
  try {
    const respuesta = await fetch("/api/asistencias", { cache: "no-store" });
    const resultado = await respuesta.json();
    return respuesta.ok && resultado.ok && Array.isArray(resultado.dato)
      ? resultado.dato as Asistencia[] : [];
  } catch {
    return [];
  }
}

export function useAsistencias(): Asistencia[] {
  const { sesion, cargando } = useSesion();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const idUsuario = sesion?.usuario.idUsuario;

  useEffect(() => {
    if (cargando || idUsuario === undefined) return;
    let vigente = true;
    const recargar = () => {
      pedirAsistencias().then((datos) => {
        if (vigente) setAsistencias(datos);
      });
    };
    recargar();
    window.addEventListener(EVENTO, recargar);
    return () => {
      vigente = false;
      window.removeEventListener(EVENTO, recargar);
    };
  }, [cargando, idUsuario]);

  return idUsuario === undefined ? [] : asistencias;
}
