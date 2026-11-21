
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  leerEstadoPedidos,
  pedidosDesde,
  suscribirPedidos,
} from "@/mocks/compra";

import {
  apiListarPedidos,
  apiDetallePedido,
  type PedidoGestion,
  type CambioEstadoPedido,
} from "@/lib/api-pedidos";

// Tipo utilizado por el nuevo panel conectado a PostgreSQL.
export type PedidoPanel = PedidoGestion & {
  direccionEntrega: string | null;
};

/**
 * Hook anterior de pedidos simulados.
 *
 * Se conserva temporalmente porque otras pantallas
 * todavía dependen de esta estructura.
 */
export function usePedidos() {
  const estado = useSyncExternalStore(
    suscribirPedidos,
    leerEstadoPedidos,
    () => "[null,null]"
  );

  return useMemo(
    () => pedidosDesde(estado),
    [estado]
  );
}

/**
 * Hook nuevo para consultar los pedidos reales
 * registrados en PostgreSQL.
 *
 * Se utilizará en el panel del Encargado de pedidos.
 */
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

  const refrescar = useCallback(async () => {
    setCargando(true);
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
    // Iniciar la consulta después de la ejecución
    // síncrona del efecto.
    await Promise.resolve();

    if (cancelado) return;

    await refrescar();
  }

  void cargarPedidosIniciales();

  return () => {
    cancelado = true;
  };
}, [refrescar]);

  return {
    pedidos,
    historial,
    cargando,
    error,
    refrescar,
  };
}
