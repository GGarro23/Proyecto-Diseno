"use client";

import { PerfilUsuario } from "@/components/cuenta/perfil-usuario";
import { RequiereSesion } from "@/components/cuenta/requiere-sesion";

// Mi perfil (Figuras 20 y 21)
export default function Perfil() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <RequiereSesion volver="/perfil">{(sesion) => <PerfilUsuario key={sesion.usuario.correo} sesion={sesion} />}</RequiereSesion>
    </div>
  );
}