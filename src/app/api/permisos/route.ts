import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import type { MatrizPermisos } from "@/modules/autenticacion-usuarios/permisos";
import { consultarPermisos, guardarPermisos } from "@/modules/autenticacion-usuarios/service";

// GET /api/permisos   Matriz rol -> códigos de permiso                                   RF-10
// PUT /api/permisos   Guardar la matriz { "Profesor": ["asistencias.registrar"], ... }   RF-10
// Solo el Administrador del sistema.

export function GET() {
  return manejar(async () => exito(await consultarPermisos()));
}

export function PUT(peticion: Request) {
  return manejar(async () => exito(await guardarPermisos(await leerCuerpo<MatrizPermisos>(peticion))));
}
