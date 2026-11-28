"use client";

import { ListaPedidosCliente } from "@/components/cuenta/lista-pedidos-cliente";
import { ControlSesion } from "@/components/cuenta/control-sesion";

export default function MisPedidos() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-5xl">
          Mis <em className="text-naranja">pedidos</em>
        </h1>
      </div>
      <ControlSesion volver="/mis-pedidos">{(sesion) => <ListaPedidosCliente idUsuario={sesion.usuario.idUsuario} />}</ControlSesion>
    </div>
  );
}