
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  apiListarPedidos,
  apiDetallePedido,
  type PedidoGestion,
  type CambioEstadoPedido,
} from "@/lib/api-pedidos";

export type PedidoPanel = PedidoGestion & {
  direccionEntrega: string | null;
};

export function usePedidosReales() {
  const [pedidos, setPedidos] = useState<
    PedidoPanel[]
  >([]);

  const [historial, setHistorial] = useState<
    CambioEstadoPedido[]
  >([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(
    null
  );

  const refrescar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError(null);

    try {
      const resultado = await apiListarPedidos();

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }

      const detalles = await Promise.all(
        resultado.dato.map((pedido) =>
          apiDetallePedido(pedido.idPedido)
        )
      );

      const pedidosCompletos: PedidoPanel[] = [];
      const cambios: CambioEstadoPedido[] = [];

      for (
        let indice = 0;
        indice < resultado.dato.length;
        indice++
      ) {
        const pedido = resultado.dato[indice];
        const detalle = detalles[indice];

        if (!detalle.ok) {
          throw new Error(detalle.error);
        }

        pedidosCompletos.push({
          ...pedido,
          direccionEntrega:
            detalle.dato.direccionEntrega,
        });

        cambios.push(
  ...detalle.dato.historial.map((cambio) => ({
    ...cambio,
    idPedido: pedido.idPedido,
  }))
);
      }

      setPedidos(pedidosCompletos);

      setHistorial(
        cambios.sort(
          (a, b) =>
            new Date(b.fechaCambio).getTime() -
            new Date(a.fechaCambio).getTime()
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible consultar los pedidos."
      );
    } finally {
      setCargando(false);
    }
  }, []);

 useEffect(() => {
  let cancelado = false;

  async function cargarPedidosIniciales() {
    await Promise.resolve();

    if (cancelado) return;

    await refrescar();
  }

  void cargarPedidosIniciales();

  return () => {
    cancelado = true;
  };
}, [refrescar]);

  const moverPedido = useCallback((idPedido: number, estadoOperativo: PedidoGestion["estadoOperativo"]) => {
    setPedidos((actuales) =>
      actuales.map((pedido) =>
        pedido.idPedido === idPedido ? { ...pedido, estadoOperativo } : pedido
      )
    );
  }, []);

  return {
    pedidos,
    historial,
    cargando,
    error,
    refrescar,
    moverPedido,
  };
}
