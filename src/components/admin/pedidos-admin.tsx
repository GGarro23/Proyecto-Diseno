"use client";

import { PanelPedidos } from "@/components/pedidos/panel-pedidos";
import { useSesion } from "@/components/sesion/proveedor-sesion";

// Consulta de pedidos para el Administrador (RF-27). Solo el Encargado de pedidos cambia estados (RF-28).
export function PedidosAdmin() {
  const { sesion } = useSesion();
  return sesion ? <PanelPedidos sesion={sesion} /> : null;
}