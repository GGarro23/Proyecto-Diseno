"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { llamarApi, type Resultado } from "@/lib/api";
import type { Sesion, UsuarioPublico } from "@/modules/autenticacion-usuarios/schema";
import type { DatosCuenta } from "@/modules/autenticacion-usuarios/validaciones";

// Punto único de acceso a la sesión en el frontend. Habla con /api/autenticacion.

type ContextoSesion = {
  sesion: Sesion | null;
  cargando: boolean; // true mientras se consulta la sesión al abrir la página
  iniciarSesion: (correo: string, contrasena: string) => Promise<Resultado<Sesion>>;
  cerrarSesion: () => Promise<void>;
  registrar: (datos: DatosCuenta & { contrasena: string }) => Promise<Resultado<UsuarioPublico>>;
  actualizarPerfil: (datos: DatosCuenta) => Promise<Resultado<UsuarioPublico>>;
};

const Contexto = createContext<ContextoSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    llamarApi<Sesion | null>("/api/autenticacion/sesion").then((resultado) => {
      setSesion(resultado.ok ? resultado.dato : null);
      setCargando(false);
    });
  }, []);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    const resultado = await llamarApi<Sesion>("/api/autenticacion/sesion", "POST", { correo, contrasena });
    if (resultado.ok) setSesion(resultado.dato);
    return resultado;
  }, []);

  const cerrarSesion = useCallback(async () => {
    await llamarApi("/api/autenticacion/sesion", "DELETE");
    setSesion(null);
  }, []);

  const registrar = useCallback(
    (datos: DatosCuenta & { contrasena: string }) => llamarApi<UsuarioPublico>("/api/autenticacion/registro", "POST", datos),
    []
  );

  const actualizarPerfil = useCallback(async (datos: DatosCuenta) => {
    const resultado = await llamarApi<UsuarioPublico>("/api/autenticacion/perfil", "PUT", datos);
    if (resultado.ok) setSesion((actual) => (actual ? { ...actual, usuario: resultado.dato } : actual));
    return resultado;
  }, []);

  return (
    <Contexto.Provider value={{ sesion, cargando, iniciarSesion, cerrarSesion, registrar, actualizarPerfil }}>
      {children}
    </Contexto.Provider>
  );
}

export function useSesion() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useSesion debe usarse dentro de ProveedorSesion");
  return contexto;
}