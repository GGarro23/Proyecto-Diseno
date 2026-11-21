
import {
  ErrorApi,
  exito,
  leerCuerpo,
  manejar,
} from "@/lib/respuesta";
import {
  consultarPedidos,
  consultarMisPedidos,
} from "@/modules/gestion-pedidos/service";
import { crearPedido } from "@/modules/ventas-pagos/service";
import { connection } from "next/server";
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

export async function GET(peticion: Request) {
  await connection();

  return manejar(async () => {
    const url = new URL(peticion.url);
    const soloMios = url.searchParams.get("mios") === "true";

    const pedidos = soloMios
      ? await consultarMisPedidos()
      : await consultarPedidos();

    return exito(pedidos);
  });
}