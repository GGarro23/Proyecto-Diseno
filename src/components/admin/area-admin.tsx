"use client";

import type { ReactNode } from "react";
import { ControlSesion } from "@/components/cuenta/control-sesion";
import { BotonEnlace } from "@/components/ui/boton";
import { BarraAdmin } from "./barra-admin";

export function AreaAdmin({ children }: { children: ReactNode }) {
  return (
    <ControlSesion volver="/admin">
      {(sesion) =>
        sesion.roles.includes("Administrador") ? (
          <div className="flex min-h-[calc(100vh-5rem)]">
            <BarraAdmin />
            <div className="min-w-0 flex-1 px-10 py-10">{children}</div>
          </div>
        ) : (
          <div className="mx-auto my-12 flex max-w-xl flex-col items-center gap-5 border border-borde bg-papel p-12 text-center">
            <p className="text-gris">Esta sección es exclusiva del Administrador.</p>
            <BotonEnlace href="/" className="rounded-md">Volver al inicio</BotonEnlace>
          </div>
        )
      }
    </ControlSesion>
  );
}