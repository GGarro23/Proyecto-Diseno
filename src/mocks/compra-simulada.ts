import type { Producto } from "@/modules/catalogo-inventario/schema";
import type {
  CodigoEscenario,
  DetallePedido,
  ModalidadEntrega,
  Pedido,
} from "@/modules/ventas-pagos/schema";
import { productos } from "./productos";

// Simula lo que hará la API de ventas mientras no exista backend.
// Las reglas siguen RF-23, RF-24 y RF-25; el backend debe aplicarlas en el servidor.

export const COSTO_ENTREGA: Record<ModalidadEntrega, number> = {
  "Retiro presencial": 0,
  "Envío a domicilio": 3500,
};

type Linea = { idProducto: number; cantidad: number };
type Resultado<T> = { ok: true; dato: T } | { ok: false; error: string };

const CLAVE_PEDIDOS = "intervallum-pedidos";

export type PedidoConDetalle = Pedido & { detalle: DetallePedido[] };

function leerPedidos(): PedidoConDetalle[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PEDIDOS) ?? "[]");
  } catch {
    return [];
  }
}

function guardarPedidos(pedidos: PedidoConDetalle[]) {
  try {
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
  } catch {}
}

export function buscarProducto(idProducto: number): Producto | undefined {
  return productos.find((p) => p.idProducto === idProducto);
}

export function calcularSubtotal(lineas: Linea[]) {
  return lineas.reduce((suma, l) => suma + (buscarProducto(l.idProducto)?.precio ?? 0) * l.cantidad, 0);
}

// RF-23 y RF-24: registra un pedido pendiente de pago. No descuenta inventario.
export function crearPedido(
  idUsuario: number,
  lineas: Linea[],
  modalidadEntrega: ModalidadEntrega,
  direccionEntrega: string | null
): Resultado<PedidoConDetalle> {
  if (lineas.length === 0) return { ok: false, error: "El carrito está vacío." };
  if (modalidadEntrega === "Envío a domicilio" && !direccionEntrega?.trim()) {
    return { ok: false, error: "El envío a domicilio requiere una dirección de entrega." };
  }

  const pedidos = leerPedidos();
  const idPedido = pedidos.length + 1;
  const costoEntrega = COSTO_ENTREGA[modalidadEntrega];

  const pedido: PedidoConDetalle = {
    idPedido,
    idUsuario,
    fechaCreacion: new Date().toISOString(),
    total: calcularSubtotal(lineas) + costoEntrega, // total = productos + entrega
    costoEntrega,
    modalidadEntrega,
    direccionEntrega: modalidadEntrega === "Envío a domicilio" ? direccionEntrega : null,
    estadoPago: "Pendiente",
    estadoOperativo: "Pendiente",
    fechaConfirmacion: null,
    detalle: lineas.map((l) => ({
      idPedido,
      idProducto: l.idProducto,
      cantidad: l.cantidad,
      precioUnitario: buscarProducto(l.idProducto)?.precio ?? 0,
    })),
  };

  guardarPedidos([...pedidos, pedido]);
  return { ok: true, dato: pedido };
}

// RF-25: simula el pago con los códigos APROBADO o RECHAZADO (Figura 15).
export function simularPago(idPedido: number, codigo: string): Resultado<PedidoConDetalle> {
  const codigoLimpio = codigo.trim().toUpperCase();
  if (codigoLimpio !== "APROBADO" && codigoLimpio !== "RECHAZADO") {
    return { ok: false, error: "Código no válido. Usa APROBADO o RECHAZADO." };
  }
  const escenario = codigoLimpio as CodigoEscenario;

  const pedidos = leerPedidos();
  const pedido = pedidos.find((p) => p.idPedido === idPedido);
  if (!pedido) return { ok: false, error: "El pedido no existe." };
  if (pedido.estadoPago === "Aprobado") return { ok: false, error: "Este pedido ya fue confirmado." };

  if (escenario === "RECHAZADO") {
    pedido.estadoPago = "Rechazado";
    guardarPedidos(pedidos);
    return { ok: false, error: "El pago simulado fue rechazado. El pedido no se confirmó." };
  }

  // Se verifica de nuevo el inventario antes de confirmar
  const sinExistencias = pedido.detalle.find(
    (d) => (buscarProducto(d.idProducto)?.existencias ?? 0) < d.cantidad
  );
  if (sinExistencias) {
    return { ok: false, error: "No hay existencias suficientes para confirmar el pedido." };
  }

  // En el backend esto ocurre en una sola transacción junto con el descuento de inventario
  pedido.estadoPago = "Aprobado";
  pedido.fechaConfirmacion = new Date().toISOString();
  guardarPedidos(pedidos);
  return { ok: true, dato: pedido };
}