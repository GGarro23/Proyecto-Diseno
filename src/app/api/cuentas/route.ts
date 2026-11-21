import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import type { NombreRol } from "@/modules/autenticacion-usuarios/schema";
import { listarCuentas, registrarCuentaInterna } from "@/modules/autenticacion-usuarios/service";

export function GET() {
  return manejar(async () => exito(await listarCuentas()));
}

export function POST(peticion: Request) {
  return manejar(async () => {
    const datos = await leerCuerpo<{ nombre: string; correo: string; contrasena: string; roles: NombreRol[] }>(peticion);
    return exito(await registrarCuentaInterna(datos), 201);
  });
}
