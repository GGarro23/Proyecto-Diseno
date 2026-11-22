import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import type { NombreRol } from "@/modules/autenticacion-usuarios/schema";
import { modificarCuenta } from "@/modules/autenticacion-usuarios/service";

// PUT /api/cuentas/{idUsuario}   Modificar nombre, correo y roles { nombre, correo, roles }   RF-07, RF-09
// Solo el Administrador del sistema. Los datos y los roles se guardan juntos.

export function PUT(peticion: Request, { params }: { params: Promise<{ idUsuario: string }> }) {
  return manejar(async () => {
    const { idUsuario } = await params;
    const datos = await leerCuerpo<{ nombre: string; correo: string; roles: NombreRol[] }>(peticion);
    return exito(await modificarCuenta(Number(idUsuario), datos));
  });
}
