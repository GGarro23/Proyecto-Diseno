import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { actualizarPerfil } from "@/modules/autenticacion-usuarios/service";
import type { DatosCuenta } from "@/modules/autenticacion-usuarios/validaciones";

// PUT /api/autenticacion/perfil   Actualizar datos personales propios       RF-05
// Cuerpo: { nombre, correo, telefono, provincia }. Requiere sesión.

export function PUT(peticion: Request) {
  return manejar(async () => exito(await actualizarPerfil(await leerCuerpo<DatosCuenta>(peticion))));
}