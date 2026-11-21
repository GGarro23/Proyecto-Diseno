
import {
  ErrorApi,
  exito,
  manejar,
} from "@/lib/respuesta";

import {
  consultarNotificacionesPedido,
} from "@/modules/notificaciones/service";

type Contexto = {
  params: Promise<{
    idPedido: string;
  }>;
};

/**
 * GET /api/pedidos/[idPedido]/notificaciones
 *
 * Consulta las notificaciones relacionadas
 * con un pedido específico.
 */
export function GET(
  _peticion: Request,
  contexto: Contexto
) {
  return manejar(async () => {
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

    const notificaciones =
      await consultarNotificacionesPedido(idPedido);

    return exito(notificaciones);
  });
}
