import type { MovimientoInventario, Producto, TipoMovimiento } from "./schema";

export const UMBRAL_INVENTARIO_BAJO = 3;

export function tieneInventarioBajo(producto: Producto): boolean {
  return producto.activo && producto.existencias <= UMBRAL_INVENTARIO_BAJO;
}

export function cambioEnExistencias(tipo: TipoMovimiento, cantidad: number): number {
  return tipo === "Entrada" || tipo === "Ajuste positivo" ? cantidad : -cantidad;
}

export type EstadoExistencias = "Disponible" | "Existencias bajas" | "Agotado" | "Inactivo";

export function estadoExistencias(producto: Producto): EstadoExistencias {
  if (!producto.activo) return "Inactivo";
  if (producto.existencias === 0) return "Agotado";
  if (tieneInventarioBajo(producto)) return "Existencias bajas";
  return "Disponible";
}

export type MovimientoConSaldo = MovimientoInventario & {
  saldoAnterior: number | null;
  saldoNuevo: number | null;
};

export function calcularSaldos(
  movimientos: MovimientoInventario[],
  productos: Producto[]
): MovimientoConSaldo[] {
  const acumulados = new Map<number, number>();
  const actuales = new Map(productos.map((p) => [p.idProducto, p.existencias]));

  for (const movimiento of movimientos) {
    acumulados.set(
      movimiento.idProducto,
      (acumulados.get(movimiento.idProducto) ?? 0) +
        cambioEnExistencias(movimiento.tipo, movimiento.cantidad)
    );
  }

  const saldos = new Map<number, number>();
  for (const [idProducto, actual] of actuales) {
    const inicial = actual - (acumulados.get(idProducto) ?? 0);
    if (Number.isFinite(inicial) && inicial >= 0) saldos.set(idProducto, inicial);
  }

  return [...movimientos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.idMovimiento - b.idMovimiento)
    .map((movimiento) => {
      const anterior = saldos.get(movimiento.idProducto);
      if (anterior === undefined) {
        return { ...movimiento, saldoAnterior: null, saldoNuevo: null };
      }
      const nuevo = anterior + cambioEnExistencias(movimiento.tipo, movimiento.cantidad);
      if (nuevo < 0) {
        saldos.delete(movimiento.idProducto);
        return { ...movimiento, saldoAnterior: null, saldoNuevo: null };
      }
      saldos.set(movimiento.idProducto, nuevo);
      return { ...movimiento, saldoAnterior: anterior, saldoNuevo: nuevo };
    });
}
