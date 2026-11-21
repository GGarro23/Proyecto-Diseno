import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { registrar } from "@/modules/autenticacion-usuarios/service";
import type { DatosCuenta } from "@/modules/autenticacion-usuarios/validaciones";

export function POST(peticion: Request) {
  return manejar(async () => {
    const datos = await leerCuerpo<DatosCuenta & { contrasena: string }>(peticion);
    return exito(await registrar(datos), 201);
  });
}