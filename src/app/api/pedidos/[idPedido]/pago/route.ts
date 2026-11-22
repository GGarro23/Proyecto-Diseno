
import {
  ErrorApi,
  exito,
  leerCuerpo,
  manejar,
} from "@/lib/respuesta";

import { simularPago } from "@/modules/ventas-pagos/service";

type Contexto = {
  params: Promise<{
    idPedido: string;
  }>;
};

export function POST(
  peticion: Request,
  contexto: Contexto
) {
  return manejar(async () => {
    const { idPedido: parametroId } = await contexto.params;

    const idPedido = Number(parametroId);

    if (
      !/^[1-9]\d*$/.test(parametroId) ||
      !Number.isSafeInteger(idPedido)
    ) {
      throw new ErrorApi(
        400,
        "El identificador del pedido no es válido."
      );
    }

    const datos = await leerCuerpo<{
      codigoEscenario?: unknown;
    }>(peticion);

    if (
      !datos ||
      (datos.codigoEscenario !== "PAGO_OK" &&
        datos.codigoEscenario !== "PAGO_RECHAZADO")
    ) {
      throw new ErrorApi(
        400,
        "El escenario debe ser PAGO_OK o PAGO_RECHAZADO."
      );
    }

    const resultado = await simularPago(
      idPedido,
      datos.codigoEscenario
    );

    return exito(resultado);
  });
}
