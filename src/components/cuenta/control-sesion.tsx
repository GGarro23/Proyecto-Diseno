"use client";

import type { ReactNode } from "react";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { BotonEnlace } from "@/components/ui/boton";
import type { Sesion } from "@/modules/autenticacion-usuarios/schema";

// Muestra el contenido solo con sesión activa; si no, invita a iniciar sesión
export function ControlSesion({ volver, children }: { volver: string; children: (sesion: Sesion) => ReactNode }) {
  const { sesion, cargando } = useSesion();
  if (cargando) return <p className="py-12 text-center text-sm text-gris">Cargando…</p>;
  if (!sesion) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 border border-borde bg-papel p-12 text-center">
        <p className="text-gris">Inicia sesión para ver esta sección.</p>
        <BotonEnlace href={`/iniciar-sesion?volver=${volver}`}>Iniciar sesión</BotonEnlace>
      </div>
    );
  }
  return <>{children(sesion)}</>;
}