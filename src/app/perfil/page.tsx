"use client";

import { PerfilUsuario } from "@/components/cuenta/perfil-usuario";
import { ControlSesion } from "@/components/cuenta/control-sesion";

export default function Perfil() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <ControlSesion volver="/perfil">{(sesion) => <PerfilUsuario key={sesion.usuario.correo} sesion={sesion} />}</ControlSesion>
    </div>
  );
}