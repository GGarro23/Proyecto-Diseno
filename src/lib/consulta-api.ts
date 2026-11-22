"use client";

import { useCallback, useEffect, useState } from "react";
import { llamarApi } from "./api";

export function useConsultaApi<T>(ruta: string, inicial: T) {
  const [estado, setEstado] = useState<{ dato: T; cargando: boolean; error: string | null }>({ dato: inicial, cargando: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    llamarApi<T>(ruta).then((resultado) => {
      if (!vigente) return;
      setEstado((actual) =>
        resultado.ok ? { dato: resultado.dato, cargando: false, error: null } : { ...actual, cargando: false, error: resultado.error }
      );
    });
    return () => {
      vigente = false;
    };
  }, [ruta, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { ...estado, recargar };
}
