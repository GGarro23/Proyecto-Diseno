import type { EstadoOperativo } from "@/modules/ventas-pagos/schema";

export type HistorialEstadoPedido = {
  idCambio: number;
  idPedido: number;
  estadoAnterior: EstadoOperativo;
  estadoNuevo: EstadoOperativo;
  fechaCambio: string;
  idResponsable: number;
};