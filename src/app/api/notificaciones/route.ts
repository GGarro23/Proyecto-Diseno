
import { exito, manejar } from "@/lib/respuesta";

import {
  consultarMisNotificaciones,
} from "@/modules/notificaciones/service";

/**
 * GET /api/notificaciones
 *
 * Consulta las notificaciones del usuario autenticado.
 *
 * No permite consultar las notificaciones
 * de otros usuarios.
 */
export function GET() {
  return manejar(async () => {
    const notificaciones = await consultarMisNotificaciones();

    return exito(notificaciones);
  });
}
