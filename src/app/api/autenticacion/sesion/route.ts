import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { cerrarSesion, iniciarSesion, sesionActual } from "@/modules/autenticacion-usuarios/service";

// GET    /api/autenticacion/sesion   Sesión actual (o null si no hay)
// POST   /api/autenticacion/sesion   Iniciar sesión { correo, contrasena }      RF-02
// DELETE /api/autenticacion/sesion   Cerrar sesión                               RF-03

export function GET() {
  return manejar(async () => exito(await sesionActual()));
}

export function POST(peticion: Request) {
  return manejar(async () => {
    const { correo, contrasena } = await leerCuerpo<{ correo: string; contrasena: string }>(peticion);
    return exito(await iniciarSesion(correo, contrasena));
  });
}

export function DELETE() {
  return manejar(async () => {
    await cerrarSesion();
    return exito(null);
  });
}