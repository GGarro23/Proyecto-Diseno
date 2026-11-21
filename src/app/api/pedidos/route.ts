
import {
  ErrorApi,
  exito,
  leerCuerpo,
  manejar,
} from "@/lib/respuesta";
import { consultarPedidos } from "@/modules/gestion-pedidos/service";
import { crearPedido } from "@/modules/ventas-pagos/service";

// POST /api/pedidos
// Crear pedido desde el carrito del usuario autenticado.
export function POST(peticion: Request) {
  return manejar(async () => {
    const datos = await leerCuerpo<{
      modalidadEntrega?: unknown;
      direccionEntrega?: unknown;
    }>(peticion);

    if (
      !datos ||
      (datos.modalidadEntrega !== "ENVIO" &&
        datos.modalidadEntrega !== "RETIRO")
    ) {
      throw new ErrorApi(
        400,
        "La modalidad debe ser ENVIO o RETIRO."
      );
    }

    if (
      datos.direccionEntrega !== undefined &&
      datos.direccionEntrega !== null &&
      typeof datos.direccionEntrega !== "string"
    ) {
      throw new ErrorApi(
        400,
        "La dirección debe ser un texto."
      );
    }

    const pedido = await crearPedido(
      datos.modalidadEntrega,
      typeof datos.direccionEntrega === "string"
        ? datos.direccionEntrega
        : null
    );

    return exito(pedido, 201);
  });
}

/**
 * GET /api/pedidos
 *
 * Permite consultar todos los pedidos.
 *
 * Roles autorizados:
 * - Administrador
 * - Encargado de pedidos
 */
export function GET() {
  return manejar(async () => {
    const pedidos = await consultarPedidos();

    return exito(pedidos);
  });
}
