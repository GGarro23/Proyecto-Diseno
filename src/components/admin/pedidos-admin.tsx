"use client";

import { PanelEncargado } from "@/components/pedidos/panel-encargado";
import { useSesion } from "@/components/sesion/proveedor-sesion";

// Consulta de pedidos para el Administrador (RF-27). Solo el Encargado de pedidos cambia estados (RF-28).
export function PedidosAdmin() {
  const { sesion } = useSesion();
  return sesion ? <PanelEncargado sesion={sesion} /> : null;
}