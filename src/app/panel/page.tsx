"use client";

import { Redirigir } from "@/components/cuenta/redirigir";
import { RequiereSesion } from "@/components/cuenta/requiere-sesion";
import { PanelEstudiante } from "@/components/panel/panel-estudiante";
import { PanelPedidos } from "@/components/pedidos/panel-pedidos";
import { PanelProfesor } from "@/components/profesor/panel-profesor";
import { BotonEnlace } from "@/components/ui/boton";

// Mi panel: muestra el panel según el rol (Figuras 22, 23, 28 y 31).
// El Administrador tiene su propia sección en /admin.
export default function Panel() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <RequiereSesion volver="/panel">
        {(sesion) => {
          if (sesion.roles.includes("Administrador")) return <Redirigir a="/admin" />;
          if (sesion.roles.includes("Encargado de pedidos")) return <PanelPedidos sesion={sesion} />;
          if (sesion.roles.includes("Profesor")) return <PanelProfesor sesion={sesion} />;
          if (sesion.roles.includes("Estudiante")) return <PanelEstudiante sesion={sesion} />;
          return (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 border border-borde bg-papel p-12 text-center">
              <p className="text-gris">El panel de tu rol todavía no está disponible.</p>
              <BotonEnlace href="/">Volver al inicio</BotonEnlace>
            </div>
          );
        }}
      </RequiereSesion>
    </div>
  );
}