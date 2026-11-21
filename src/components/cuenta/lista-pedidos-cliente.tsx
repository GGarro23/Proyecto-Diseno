
"use client";

import { useEffect, useState } from "react";

import { BotonEnlace } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/textos";
import { formatearColones } from "@/lib/formato";

import {
  apiConsultarMisPedidos,
  type PedidoResumen,
} from "@/lib/api-ventas";

type Props = {
  idUsuario: number;
};

function describirEstado(estado: string) {
  const estados: Record<string, string> = {
    PENDIENTE: "Pendiente",
    CONFIRMADO: "Confirmado",
    EN_PREPARACION: "En preparación",
    EMPACADO: "Empacado",
    ENVIADO: "Enviado",
    LISTO_RETIRO: "Listo para retiro",
    RETIRADO: "Retirado",
  };

  return estados[estado] ?? estado;
}

export function ListaPedidosCliente({
  idUsuario,
}: Props) {
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarPedidos() {
      try {
        const resultado = await apiConsultarMisPedidos();

        if (cancelado) return;

        if (!resultado.ok) {
          setError(resultado.error);
          return;
        }

        setPedidos(
          resultado.dato.filter(
            (pedido) =>
              Number(pedido.idUsuario) === idUsuario
          )
        );
      } catch {
        if (!cancelado) {
          setError(
            "No fue posible consultar tus pedidos."
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    void cargarPedidos();

    return () => {
      cancelado = true;
    };
  }, [idUsuario]);

  if (cargando) {
    return (
      <div className="border border-borde bg-papel p-8 text-center">
        <p className="text-gris">
          Cargando tus pedidos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="border border-borde bg-papel p-8 text-center"
      >
        <p className="text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 border border-borde bg-papel p-12 text-center">
        <p className="text-gris">
          Todavía no tienes pedidos.
        </p>

        <BotonEnlace href="/catalogo">
          Explorar instrumentos
        </BotonEnlace>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-borde bg-papel">
      <table className="w-full text-sm">
        <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
          <tr>
            {[
              "Pedido",
              "Fecha",
              "Total",
              "Modalidad",
              "Pago",
              "Estado",
            ].map((titulo) => (
              <th
                key={titulo}
                className="px-5 py-3 font-medium"
              >
                {titulo}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {pedidos.map((pedido) => (
            <tr
              key={pedido.idPedido}
              className="border-t border-borde"
            >
              <td className="px-5 py-4 font-medium">
                N.º {pedido.idPedido}
              </td>

              <td className="px-5 py-4">
                {pedido.fechaCreacion.slice(0, 10)}
              </td>

              <td className="px-5 py-4">
                {formatearColones(
                  Number(pedido.total)
                )}
              </td>

              <td className="px-5 py-4">
                {pedido.modalidadEntrega === "ENVIO"
                  ? "Envío a domicilio"
                  : "Retiro presencial"}
              </td>

              <td
                className={`px-5 py-4 ${
                  pedido.estadoPago === "PENDIENTE"
                    ? "text-amber-700"
                    : ""
                }`}
              >
                {describirEstado(pedido.estadoPago)}
              </td>

              <td className="px-5 py-4">
                {pedido.estadoPago === "CONFIRMADO" ? (
                  <Insignia>
                    {describirEstado(
                      pedido.estadoOperativo
                    )}
                  </Insignia>
                ) : (
                  <span className="text-gris">
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
