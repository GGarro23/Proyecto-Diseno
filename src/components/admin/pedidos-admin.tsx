"use client";

import { PanelEncargado } from "@/components/pedidos/panel-encargado";
import { useSesion } from "@/components/sesion/proveedor-sesion";

export function PedidosAdmin() {
  const { sesion } = useSesion();
  return sesion ? <PanelEncargado sesion={sesion} /> : null;
}