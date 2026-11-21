import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { cerrarSesion, iniciarSesion, sesionActual } from "@/modules/autenticacion-usuarios/service";

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