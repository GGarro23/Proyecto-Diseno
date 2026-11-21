"use client";

import { Redireccion } from "@/components/cuenta/redireccion";
import { ControlSesion } from "@/components/cuenta/control-sesion";
import { PanelEstudiante } from "@/components/panel/panel-estudiante";
import { PanelEncargado } from "@/components/pedidos/panel-encargado";
import { PanelProfesor } from "@/components/profesor/panel-profesor";
import { PanelSistema } from "@/components/sistema/panel-sistema";
import { BotonEnlace } from "@/components/ui/boton";

// Mi panel: muestra el panel según el rol (Figuras 22, 23, 28, 31 y 40).
// El Administrador tiene su propia sección en /admin.
export default function Panel() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <ControlSesion volver="/panel">
        {(sesion) => {
          if (sesion.roles.includes("Administrador")) return <Redireccion a="/admin" />;
          if (sesion.roles.includes("Administrador del sistema")) return <PanelSistema sesion={sesion} />;
          if (sesion.roles.includes("Encargado de pedidos")) return <PanelEncargado sesion={sesion} />;
          if (sesion.roles.includes("Profesor")) return <PanelProfesor sesion={sesion} />;
          if (sesion.roles.includes("Estudiante")) return <PanelEstudiante sesion={sesion} />;
          return (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 border border-borde bg-papel p-12 text-center">
              <p className="text-gris">El panel de tu rol todavía no está disponible.</p>
              <BotonEnlace href="/">Volver al inicio</BotonEnlace>
            </div>
          );
        }}
      </ControlSesion>
    </div>
  );
}