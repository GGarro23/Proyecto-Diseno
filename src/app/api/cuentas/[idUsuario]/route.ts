import { exito, leerCuerpo, leerId, manejar } from "@/lib/respuesta";
import type { NombreRol } from "@/modules/autenticacion-usuarios/schema";
import { modificarCuenta } from "@/modules/autenticacion-usuarios/service";

export function PUT(peticion: Request, { params }: { params: Promise<{ idUsuario: string }> }) {
  return manejar(async () => {
    const { idUsuario } = await params;
    const datos = await leerCuerpo<{ nombre: string; correo: string; roles: NombreRol[] }>(peticion);
    return exito(await modificarCuenta(leerId(idUsuario, "El identificador de la cuenta no es válido."), datos));
  });
}
