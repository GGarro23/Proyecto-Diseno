
import {
  ErrorApi,
  exito,
  leerCuerpo,
  manejar,
} from "@/lib/respuesta";

import {
  consultarDetallePedido,
  cambiarEstadoPedido,
} from "@/modules/gestion-pedidos/service";

type Contexto = {
  params: Promise<{
    idPedido: string;
  }>;
};

async function obtenerIdPedido(contexto: Contexto) {
  const { idPedido: parametro } = await contexto.params;
  const idPedido = Number(parametro);

  if (
    !/^[1-9]\d*$/.test(parametro) ||
    !Number.isSafeInteger(idPedido)
  ) {
    throw new ErrorApi(
      400,
      "El identificador del pedido no es válido."
    );
  }

  return idPedido;
}

export function GET(
  _peticion: Request,
  contexto: Contexto
) {
  return manejar(async () => {
    const idPedido = await obtenerIdPedido(contexto);

    const pedido = await consultarDetallePedido(idPedido);

    return exito(pedido);
  });
}

export function PATCH(
  peticion: Request,
  contexto: Contexto
) {
  return manejar(async () => {
    const idPedido = await obtenerIdPedido(contexto);

    const datos = await leerCuerpo<{
      estadoNuevo?: unknown;
    }>(peticion);

    if (
      !datos ||
      typeof datos.estadoNuevo !== "string"
    ) {
      throw new ErrorApi(
        400,
        "Debes indicar el nuevo estado del pedido."
      );
    }

    const resultado = await cambiarEstadoPedido(
      idPedido,
      datos.estadoNuevo
    );

    return exito(resultado);
  });
}
