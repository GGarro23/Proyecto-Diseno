import type { MovimientoInventario, Producto, TipoMovimiento } from "./schema";

// Un producto activo con esta cantidad de existencias o menos tiene inventario bajo.
// Lo usan el panel del Administrador (Figura 31) y el agente de reabastecimiento (RF-45).
export const UMBRAL_INVENTARIO_BAJO = 3;

export function tieneInventarioBajo(producto: Producto): boolean {
  return producto.activo && producto.existencias <= UMBRAL_INVENTARIO_BAJO;
}

// Cuánto cambia la existencia con un movimiento: Entrada y Ajuste positivo suman,
// Ajuste negativo y Descuento restan (RF-18, RF-19, RF-25).
export function cambioEnExistencias(tipo: TipoMovimiento, cantidad: number): number {
  return tipo === "Entrada" || tipo === "Ajuste positivo" ? cantidad : -cantidad;
}

// Estado que se muestra en el inventario (Figura 34)
export type EstadoExistencias = "Disponible" | "Existencias bajas" | "Agotado" | "Inactivo";

export function estadoExistencias(producto: Producto): EstadoExistencias {
  if (!producto.activo) return "Inactivo";
  if (producto.existencias === 0) return "Agotado";
  if (tieneInventarioBajo(producto)) return "Existencias bajas";
  return "Disponible";
}

// Saldo antes y después de cada movimiento (Figura 39). Recorre los movimientos de cada
// producto en orden, desde existencias en 0, así que necesita el historial completo.
export type MovimientoConSaldo = MovimientoInventario & { saldoAnterior: number; saldoNuevo: number };

export function calcularSaldos(movimientos: MovimientoInventario[]): MovimientoConSaldo[] {
  const saldos = new Map<number, number>();
  return [...movimientos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.idMovimiento - b.idMovimiento)
    .map((m) => {
      const saldoAnterior = saldos.get(m.idProducto) ?? 0;
      const saldoNuevo = saldoAnterior + cambioEnExistencias(m.tipo, m.cantidad);
      saldos.set(m.idProducto, saldoNuevo);
      return { ...m, saldoAnterior, saldoNuevo };
    });
}