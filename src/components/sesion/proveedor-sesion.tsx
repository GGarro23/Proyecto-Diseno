"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import * as autenticacion from "@/mocks/auth";
import type { Sesion } from "@/modules/autenticacion-usuarios/schema";

// Punto único de acceso a la sesión. Al conectar el backend solo cambia este archivo:
// las funciones llamarán a la API en lugar de a mocks/autenticacion-simulada.

type ContextoSesion = {
  sesion: Sesion | null;
  iniciarSesion: typeof autenticacion.iniciarSesion;
  cerrarSesion: typeof autenticacion.cerrarSesion;
  registrar: typeof autenticacion.registrar;
  actualizarPerfil: typeof autenticacion.actualizarPerfil;
};

const Contexto = createContext<ContextoSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const estado = useSyncExternalStore(autenticacion.suscribirSesion, autenticacion.leerEstadoSesion, () => "|");
  const sesion = useMemo(() => autenticacion.obtenerSesion(estado), [estado]);

  return (
    <Contexto.Provider
      value={{
        sesion,
        iniciarSesion: autenticacion.iniciarSesion,
        cerrarSesion: autenticacion.cerrarSesion,
        registrar: autenticacion.registrar,
        actualizarPerfil: autenticacion.actualizarPerfil,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useSesion() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useSesion debe usarse dentro de ProveedorSesion");
  return contexto;
}