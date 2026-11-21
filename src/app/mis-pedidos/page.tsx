"use client";

import { ListaPedidos } from "@/components/cuenta/lista-pedidos";
import { RequiereSesion } from "@/components/cuenta/requiere-sesion";
import { Sobretitulo } from "@/components/ui/textos";

// Mis pedidos (RF-26, HU-08). Sin prototipo: sigue el estilo de las demás pantallas.
export default function MisPedidos() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <Sobretitulo>Tienda Intervallum</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          Mis <em className="text-naranja">pedidos</em>
        </h1>
      </div>
      <RequiereSesion volver="/mis-pedidos">{(sesion) => <ListaPedidos idUsuario={sesion.usuario.idUsuario} />}</RequiereSesion>
    </div>
  );
}