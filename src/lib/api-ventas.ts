
import { llamarApi } from "@/lib/api";

// Modalidades aceptadas por el backend.
export type ModalidadEntrega = "ENVIO" | "RETIRO";

// Escenarios de pago simulado.
export type EscenarioPago = "PAGO_OK" | "PAGO_RECHAZADO";

// Producto dentro del carrito.
export type ProductoCarrito = {
  idProducto: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  existencias: number;
};

// Respuesta de consulta del carrito.
export type CarritoApi = {
  idCarrito: number | null;
  productos: ProductoCarrito[];
  total: number;
};

// Respuesta de creación de pedidos.
export type PedidoCreado = {
  idPedido: number;
  modalidadEntrega: ModalidadEntrega;
  estadoPago: string;
  mensaje: string;
};

// Respuesta de pago simulado.
export type ResultadoPago = {
  idPedido: number;
  resultadoSimulacion: string;
  resultadoConfirmacion: string;
  mensaje: string;
};

// Consultar carrito.
export function apiConsultarCarrito() {
  return llamarApi<CarritoApi>("/api/carrito");
}

// Agregar producto.
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

// Actualizar cantidad.
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

// Eliminar producto.
export function apiEliminarCarrito(idProducto: number) {
  return llamarApi(
    "/api/carrito",
    "DELETE",
    { idProducto }
  );
}

// Crear pedido desde el carrito.
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

// Simular pago.
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
