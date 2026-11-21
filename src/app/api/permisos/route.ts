import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import type { MatrizPermisos } from "@/modules/autenticacion-usuarios/permisos";
import { consultarPermisos, guardarPermisos } from "@/modules/autenticacion-usuarios/service";

export function GET() {
  return manejar(async () => exito(await consultarPermisos()));
}

export function PUT(peticion: Request) {
  return manejar(async () => exito(await guardarPermisos(await leerCuerpo<MatrizPermisos>(peticion))));
}
