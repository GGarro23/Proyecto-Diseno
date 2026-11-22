
import { llamarApi } from "@/lib/api";

export type ModalidadEntrega = "ENVIO" | "RETIRO";

export type EscenarioPago = "PAGO_OK" | "PAGO_RECHAZADO";

export type ProductoCarrito = {
  idProducto: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  existencias: number;
};

export type CarritoApi = {
  idCarrito: number | null;
  productos: ProductoCarrito[];
  total: number;
};

export type PedidoCreado = {
  idPedido: number;
  modalidadEntrega: ModalidadEntrega;
  estadoPago: string;
  mensaje: string;
};

export type ResultadoPago = {
  idPedido: number;
  resultadoSimulacion: string;
  resultadoConfirmacion: string;
  mensaje: string;
};

export function apiConsultarCarrito() {
  return llamarApi<CarritoApi>("/api/carrito");
}

export function apiAgregarCarrito(
  idProducto: number,
  cantidad: number
) {
  return llamarApi(
    "/api/carrito",
    "POST",
    { idProducto, cantidad }
  );
}

export function apiActualizarCarrito(
  idProducto: number,
  cantidad: number
) {
  return llamarApi(
    "/api/carrito",
    "PATCH",
    { idProducto, cantidad }
  );
}

export function apiEliminarCarrito(idProducto: number) {
  return llamarApi(
    "/api/carrito",
    "DELETE",
    { idProducto }
  );
}

export function apiCrearPedido(
  modalidadEntrega: ModalidadEntrega,
  direccionEntrega: string | null
) {
  return llamarApi<PedidoCreado>(
    "/api/pedidos",
    "POST",
    { modalidadEntrega, direccionEntrega }
  );
}

export function apiSimularPago(
  idPedido: number,
  codigoEscenario: EscenarioPago
) {
  return llamarApi<ResultadoPago>(
    `/api/pedidos/${idPedido}/pago`,
    "POST",
    { codigoEscenario }
  );
}

export type PedidoDetalle = {
  idPedido: number;
  idUsuario: number;
  total: number | string;
  modalidadEntrega: "ENVIO" | "RETIRO";
  direccionEntrega: string | null;
  estadoPago: string;
  estadoOperativo: string;
  productos: {
    idProducto: number;
    nombre: string;
    cantidad: number;
    precioUnitario: number | string;
    subtotal: number | string;
  }[];
};

export async function apiConsultarPedido(
  idPedido: number
) {
  if (!Number.isSafeInteger(idPedido) || idPedido <= 0) {
    throw new Error("Identificador de pedido inválido.");
  }

  return llamarApi<PedidoDetalle>(
    `/api/pedidos/${idPedido}`
  );
}

export type PedidoResumen = {
  idPedido: number;
  idUsuario: number;
  fechaCreacion: string;
  total: number | string;
  modalidadEntrega: "ENVIO" | "RETIRO";
  estadoPago: string;
  estadoOperativo: string;
};

export async function apiConsultarMisPedidos() {
  return llamarApi<PedidoResumen[]>(
    "/api/pedidos?mios=true"
  );
}
