"use client";

import { useEffect, useState } from "react";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import type { Inscripcion } from "@/modules/academia/schema";

const EVENTO = "intervallum-inscripciones-actualizadas";
export function avisarInscripcionesActualizadas() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

async function pedirInscripciones(): Promise<Inscripcion[]> {
  try {
    const respuesta = await fetch("/api/inscripciones", { cache: "no-store" });
    const resultado = await respuesta.json();
    if (!respuesta.ok || !resultado.ok || !Array.isArray(resultado.dato)) return [];
    return resultado.dato as Inscripcion[];
  } catch {
    return [];
  }
}

export function useInscripciones(): Inscripcion[] {
  const { sesion, cargando: cargandoSesion } = useSesion();
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const idUsuario = sesion?.usuario.idUsuario;

  useEffect(() => {
    if (cargandoSesion || idUsuario === undefined) return;
    let vigente = true;
    const recargar = () => {
      pedirInscripciones().then((datos) => {
        if (vigente) setInscripciones(datos);
      });
    };
    recargar();
    window.addEventListener(EVENTO, recargar);
    return () => {
      vigente = false;
      window.removeEventListener(EVENTO, recargar);
    };
  }, [cargandoSesion, idUsuario]);

  return idUsuario === undefined ? [] : inscripciones;
}
