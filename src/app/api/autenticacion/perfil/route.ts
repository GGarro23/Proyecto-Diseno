import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { actualizarPerfil } from "@/modules/autenticacion-usuarios/service";
import type { DatosCuenta } from "@/modules/autenticacion-usuarios/validaciones";

export function PUT(peticion: Request) {
  return manejar(async () => exito(await actualizarPerfil(await leerCuerpo<DatosCuenta>(peticion))));
}