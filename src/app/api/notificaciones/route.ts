import { connection } from "next/server";
import { exito, manejar } from "@/lib/respuesta";

import {
  consultarMisNotificaciones,
} from "@/modules/notificaciones/service";

export async function GET() {
  await connection();

  return manejar(async () => {
    const notificaciones = await consultarMisNotificaciones();

    return exito(notificaciones);
  });
}
