import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import type { NombreRol } from "@/modules/autenticacion-usuarios/schema";
import { listarCuentas, registrarCuentaInterna } from "@/modules/autenticacion-usuarios/service";

// GET  /api/cuentas   Cuentas con sus roles                                           RF-07, RF-09
// POST /api/cuentas   Registrar cuenta interna { nombre, correo, contrasena, roles }    RF-06
// Solo el Administrador del sistema.

export function GET() {
  return manejar(async () => exito(await listarCuentas()));
}

export function POST(peticion: Request) {
  return manejar(async () => {
    const datos = await leerCuerpo<{ nombre: string; correo: string; contrasena: string; roles: NombreRol[] }>(peticion);
    return exito(await registrarCuentaInterna(datos), 201);
  });
}
