
"use client";

import { useEffect, useState } from "react";

import {
  apiConsultarMisPedidos,
  type PedidoResumen,
} from "@/lib/api-ventas";

import { formatearColones } from "@/lib/formato";

type Props = {
  alSeleccionar: (idPedido: number) => void;
};

export function SelectorPedidosPendientes({
  alSeleccionar,
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
            (pedido) => pedido.estadoPago === "PENDIENTE"
          )
        );
      } catch {
        if (!cancelado) {
          setError("No se pudieron consultar los pedidos.");
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
  }, []);

  if (cargando) {
    return (
      <p className="text-sm text-gris">
        Consultando pedidos pendientes...
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (pedidos.length === 0) {
    return null;
  }

  return (
    <section className="border border-borde bg-papel p-6">
      <h2 className="mb-2 font-serif text-2xl">
        Pedidos pendientes
      </h2>

      <p className="mb-5 text-sm text-gris">
        Selecciona el pedido que deseas pagar.
      </p>

      <ul className="flex flex-col gap-3">
        {pedidos.map((pedido) => (
          <li
            key={pedido.idPedido}
            className="flex items-center justify-between gap-4 border border-borde p-4"
          >
            <div>
              <p className="font-medium">
                Pedido #{pedido.idPedido}
              </p>

              <p className="text-sm text-gris">
                {pedido.modalidadEntrega === "ENVIO"
                  ? "Envío a domicilio"
                  : "Retiro presencial"}
              </p>

              <p className="text-sm">
                {formatearColones(Number(pedido.total))}
              </p>
            </div>

            <button
              type="button"
              onClick={() => alSeleccionar(pedido.idPedido)}
              className="rounded bg-naranja px-4 py-2 text-sm text-white"
            >
              Continuar pago
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
