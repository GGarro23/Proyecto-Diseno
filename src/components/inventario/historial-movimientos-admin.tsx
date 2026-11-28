"use client";

import { useState } from "react";
import { Icono } from "@/components/ui/icono";
import { Insignia } from "@/components/ui/textos";
import { calcularSaldos, cambioEnExistencias, type MovimientoConSaldo } from "@/modules/catalogo-inventario/reglas";
import type { MovimientoInventario, Producto, TipoMovimiento } from "@/modules/catalogo-inventario/schema";
import { formatearFechaHora } from "@/lib/formato";

const TIPOS: TipoMovimiento[] = ["Entrada", "Ajuste positivo", "Ajuste negativo", "Descuento"];
const ORDENES = ["Más recientes", "Más antiguos"] as const;

const filtro = "border border-borde bg-white px-3 py-3 text-sm text-tinta outline-none focus:border-cafe";

export function origenMovimiento(m: MovimientoInventario): string {
  if (m.idResponsable !== null) return m.responsable ?? `Usuario N.º ${m.idResponsable}`;
  if (m.idPedido !== null) return `Pedido N.º ${m.idPedido}`;
  if (m.idEjecucion !== null) return `Carga ETL N.º ${m.idEjecucion}`;
  return "—";
}

export function cantidadConSigno(m: MovimientoInventario): string {
  const cambio = cambioEnExistencias(m.tipo, m.cantidad);
  return cambio > 0 ? `+${cambio}` : `−${Math.abs(cambio)}`;
}

export function HistorialMovimientosAdmin({ productos, movimientos }: { productos: Producto[]; movimientos: MovimientoInventario[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [orden, setOrden] = useState<(typeof ORDENES)[number]>("Más recientes");

  const nombreProducto = (idProducto: number) => productos.find((p) => p.idProducto === idProducto)?.nombre ?? `Producto ${idProducto}`;
  const texto = busqueda.trim().toLowerCase();

  const visibles: MovimientoConSaldo[] = calcularSaldos(movimientos, productos)
    .filter((m) => !texto || nombreProducto(m.idProducto).toLowerCase().includes(texto) || `n.º ${m.idMovimiento}`.includes(texto) || String(m.idMovimiento) === texto)
    .filter((m) => tipo === "Todos" || m.tipo === tipo);
  if (orden === "Más recientes") visibles.reverse();

  return (
    <section className="border border-borde bg-papel">
      <div className="grid gap-3 border-b border-borde p-5 lg:grid-cols-[1fr_auto_auto]">
        <label className="flex items-center gap-3 border border-borde bg-white px-4">
          <Icono nombre="buscar" className="size-4 text-gris" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar movimiento o producto..."
            className="w-full py-3 text-sm outline-none"
          />
        </label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={filtro} aria-label="Tipo de movimiento">
          <option value="Todos">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as (typeof ORDENES)[number])} className={filtro} aria-label="Orden">
          {ORDENES.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {visibles.length === 0 ? (
        <p className="p-10 text-center text-gris">No hay movimientos que coincidan con la búsqueda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
              <tr>
                <th className="px-5 py-3 font-medium">Movimiento</th>
                <th className="px-5 py-3 font-medium">Fecha y hora</th>
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 text-right font-medium">Cantidad</th>
                <th className="px-5 py-3 font-medium">Saldo</th>
                <th className="px-5 py-3 font-medium">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((m) => (
                <tr key={m.idMovimiento} className="border-t border-borde">
                  <td className="px-5 py-4 text-gris">N.º {m.idMovimiento}</td>
                  <td className="px-5 py-4">{formatearFechaHora(m.fecha)}</td>
                  <td className="px-5 py-4 font-medium">{nombreProducto(m.idProducto)}</td>
                  <td className="px-5 py-4">
                    <Insignia>{m.tipo}</Insignia>
                  </td>
                  <td className="px-5 py-4 text-right font-medium">{cantidadConSigno(m)}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {m.saldoAnterior === null || m.saldoNuevo === null ? "No reconstruible" : `${m.saldoAnterior} → ${m.saldoNuevo}`}
                  </td>
                  <td className="px-5 py-4">
                    <p>{origenMovimiento(m)}</p>
                    <p className="mt-1 text-xs text-gris">{m.motivo}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}