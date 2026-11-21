import type { Producto } from "@/modules/catalogo-inventario/schema";
import type { HistorialEstadoPedido } from "@/modules/gestion-pedidos/schema";
import { siguienteEstado } from "@/modules/gestion-pedidos/transiciones";
import type {
  CodigoEscenario,
  DetallePedido,
  ModalidadEntrega,
  Pedido,
} from "@/modules/ventas-pagos/schema";
import { productos } from "./productos";

// Simula lo que hará la API de ventas y pedidos mientras no exista backend.
// Las reglas siguen RF-23 a RF-28; el backend debe aplicarlas en el servidor.

export const COSTO_ENTREGA: Record<ModalidadEntrega, number> = {
  "Retiro presencial": 0,
  "Envío a domicilio": 3500,
};

type Linea = { idProducto: number; cantidad: number };
type Resultado<T> = { ok: true; dato: T } | { ok: false; error: string };

const CLAVE_PEDIDOS = "intervallum-pedidos";
const CLAVE_HISTORIAL = "intervallum-historial-pedidos";
const oyentes = new Set<() => void>();

export type PedidoConDetalle = Pedido & { detalle: DetallePedido[] };

// Pedidos confirmados de prueba para el panel de pedidos (montos de la Figura 28)
function pedidoPrevio(
  idPedido: number,
  idUsuario: number,
  modalidadEntrega: ModalidadEntrega,
  estadoOperativo: Pedido["estadoOperativo"],
  lineas: Linea[]
): PedidoConDetalle {
  const costoEntrega = COSTO_ENTREGA[modalidadEntrega];
  const fecha = `2026-11-${String(10 + idPedido).padStart(2, "0")}T15:00:00.000Z`;
  return {
    idPedido,
    idUsuario,
    fechaCreacion: fecha,
    total: calcularSubtotal(lineas) + costoEntrega,
    costoEntrega,
    modalidadEntrega,
    direccionEntrega: modalidadEntrega === "Envío a domicilio" ? "San José, Montes de Oca. 100 m norte del parque" : null,
    estadoPago: "Aprobado",
    estadoOperativo,
    fechaConfirmacion: fecha,
    detalle: lineas.map((l) => ({
      idPedido,
      idProducto: l.idProducto,
      cantidad: l.cantidad,
      precioUnitario: buscarProducto(l.idProducto)?.precio ?? 0,
    })),
  };
}

function pedidosPrevios(): PedidoConDetalle[] {
  return [
    pedidoPrevio(1, 1, "Envío a domicilio", "Pendiente", [{ idProducto: 1, cantidad: 1 }, { idProducto: 3, cantidad: 1 }]),
    pedidoPrevio(2, 2, "Retiro presencial", "En preparación", [{ idProducto: 2, cantidad: 1 }]),
    pedidoPrevio(3, 1000, "Envío a domicilio", "Empacado", [{ idProducto: 3, cantidad: 1 }]),
    pedidoPrevio(4, 1001, "Retiro presencial", "Listo para retiro", [{ idProducto: 1, cantidad: 1 }]),
  ];
}

function avisar() {
  oyentes.forEach((f) => f());
}

export function suscribirPedidos(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

// Para useSyncExternalStore: texto con los pedidos y el historial guardados
export function leerEstadoPedidos(): string {
  try {
    return JSON.stringify([localStorage.getItem(CLAVE_PEDIDOS), localStorage.getItem(CLAVE_HISTORIAL)]);
  } catch {
    return "[null,null]";
  }
}

// Convierte ese texto en pedidos e historial
export function pedidosDesde(estado: string): { pedidos: PedidoConDetalle[]; historial: HistorialEstadoPedido[] } {
  const [pedidos, historial] = JSON.parse(estado) as [string | null, string | null];
  return { pedidos: pedidos ? JSON.parse(pedidos) : pedidosPrevios(), historial: historial ? JSON.parse(historial) : [] };
}

export function leerPedidos(): PedidoConDetalle[] {
  try {
    const guardados = localStorage.getItem(CLAVE_PEDIDOS);
    return guardados ? JSON.parse(guardados) : pedidosPrevios();
  } catch {
    return pedidosPrevios();
  }
}

function guardarPedidos(pedidos: PedidoConDetalle[]) {
  try {
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
  } catch {}
  avisar();
}

export function leerHistorial(): HistorialEstadoPedido[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) ?? "[]");
  } catch {
    return [];
  }
}

// RF-26: pedidos de un usuario, del más reciente al más antiguo
export function pedidosDeUsuario(idUsuario: number): PedidoConDetalle[] {
  return leerPedidos()
    .filter((p) => p.idUsuario === idUsuario)
    .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
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
  const idPedido = Math.max(0, ...pedidos.map((p) => p.idPedido)) + 1;
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

// RF-28: avanza el estado operativo al siguiente válido y guarda el cambio en el historial
export function avanzarEstadoPedido(idPedido: number, idResponsable: number): Resultado<PedidoConDetalle> {
  const pedidos = leerPedidos();
  const pedido = pedidos.find((p) => p.idPedido === idPedido);
  if (!pedido) return { ok: false, error: "El pedido no existe." };
  if (pedido.estadoPago !== "Aprobado") return { ok: false, error: "El pedido no está confirmado." };

  const nuevo = siguienteEstado(pedido.modalidadEntrega, pedido.estadoOperativo);
  if (!nuevo) return { ok: false, error: "El pedido ya está en su estado final." };

  const cambio: HistorialEstadoPedido = {
    idCambio: Date.now(),
    idPedido,
    estadoAnterior: pedido.estadoOperativo,
    estadoNuevo: nuevo,
    fechaCambio: new Date().toISOString(),
    idResponsable,
  };
  pedido.estadoOperativo = nuevo;
  try {
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify([...leerHistorial(), cambio]));
  } catch {}
  // En el backend: al pasar a Enviado o Listo para retiro se envía el correo (RF-29)
  guardarPedidos(pedidos);
  return { ok: true, dato: pedido };
}