"use client";

import { useSyncExternalStore } from "react";
import { Insignia } from "@/components/ui/textos";
import { formatearColones } from "@/lib/formato";
import { pedidosDeUsuario } from "@/mocks/compra-simulada";
import { BotonEnlace } from "@/components/ui/boton";

const sinCambios = () => () => {};

// Pedidos propios con fecha, importe, modalidad, estado de pago y estado operativo (RF-26)
export function ListaPedidos({ idUsuario }: { idUsuario: number }) {
  // Se lee del navegador sin romper la primera carga
  const guardado = useSyncExternalStore(sinCambios, () => JSON.stringify(pedidosDeUsuario(idUsuario)), () => "[]");
  const pedidos: ReturnType<typeof pedidosDeUsuario> = JSON.parse(guardado);

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 border border-borde bg-papel p-12 text-center">
        <p className="text-gris">Todavía no tienes pedidos.</p>
        <BotonEnlace href="/catalogo">Explorar instrumentos</BotonEnlace>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-borde bg-papel">
      <table className="w-full text-sm">
        <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
          <tr>
            {["Pedido", "Fecha", "Total", "Modalidad", "Pago", "Estado"].map((t) => (
              <th key={t} className="px-5 py-3 font-medium">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.idPedido} className="border-t border-borde">
              <td className="px-5 py-4 font-medium">N.º {p.idPedido}</td>
              <td className="px-5 py-4">{p.fechaCreacion.slice(0, 10)}</td>
              <td className="px-5 py-4">{formatearColones(p.total)}</td>
              <td className="px-5 py-4">{p.modalidadEntrega}</td>
              <td className={`px-5 py-4 ${p.estadoPago === "Rechazado" ? "text-red-800" : ""}`}>{p.estadoPago}</td>
              <td className="px-5 py-4">
                {p.estadoPago === "Aprobado" ? <Insignia>{p.estadoOperativo}</Insignia> : <span className="text-gris">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}