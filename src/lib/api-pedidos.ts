
/**
 * API de gestión de pedidos de Intervallum.
 *
 * Estas funciones utilizan las rutas existentes
 * y conservan las validaciones de permisos del servidor.
 */

export type EstadoOperativoPedido =
  | "PENDIENTE"
  | "EN_PREPARACION"
  | "EMPACADO"
  | "ENVIADO"
  | "LISTO_RETIRO"
  | "RETIRADO";

export type ModalidadPedido = "ENVIO" | "RETIRO";

export type PedidoGestion = {
  idPedido: number;
  idUsuario: number;
  fechaCreacion: string;
  total: number | string;
  modalidadEntrega: ModalidadPedido;
  estadoPago: string;
  estadoOperativo: EstadoOperativoPedido;
};

export type CambioEstadoPedido = {
  idCambio: number;
  idPedido: number;
  estadoAnterior: EstadoOperativoPedido;
  estadoNuevo: EstadoOperativoPedido;
  fechaCambio: string;
  idResponsable: number;
};

export type DetallePedidoGestion = PedidoGestion & {
  direccionEntrega: string | null;
  productos: {
    idProducto: number;
    nombre: string;
    cantidad: number;
    precioUnitario: number | string;
    subtotal: number | string;
  }[];
  historial: CambioEstadoPedido[];
};

type RespuestaApi<T> =
  | { ok: true; dato: T }
  | { ok: false; error: string };

async function solicitar<T>(
  ruta: string,
  opciones?: RequestInit
): Promise<RespuestaApi<T>> {
  try {
    const respuesta = await fetch(ruta, {
      ...opciones,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...opciones?.headers,
      },
    });

    const datos: RespuestaApi<T> =
      await respuesta.json();

    if (!respuesta.ok) {
      return {
        ok: false,
        error:
          !datos.ok && datos.error
            ? datos.error
            : "No se pudo completar la solicitud.",
      };
    }

    return datos;
  } catch {
    return {
      ok: false,
      error: "No fue posible conectar con el servidor.",
    };
  }
}

/**
 * Consulta todos los pedidos.
 *
 * Requiere rol Administrador o Encargado de pedidos.
 */
export function apiListarPedidos() {
  return solicitar<PedidoGestion[]>("/api/pedidos");
}

/**
 * Consulta el detalle y el historial de un pedido.
 *
 * El backend verifica los permisos.
 */
export function apiDetallePedido(idPedido: number) {
  return solicitar<DetallePedidoGestion>(
    `/api/pedidos/${idPedido}`
  );
}

/**
 * Actualiza el estado operativo de un pedido.
 *
 * Solo puede ejecutarlo el Encargado de pedidos.
 */
export function apiCambiarEstadoPedido(
  idPedido: number,
  estadoNuevo: EstadoOperativoPedido
) {
  return solicitar<{
    idPedido: number;
    idCambio: number;
    estadoAnterior: string;
    estadoNuevo: string;
    mensaje: string;
  }>(
    `/api/pedidos/${idPedido}`,
    {
      method: "PATCH",
      body: JSON.stringify({ estadoNuevo }),
    }
  );
}
