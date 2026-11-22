import { exito, manejar } from "@/lib/respuesta";
import { desactivarCuenta } from "@/modules/autenticacion-usuarios/service";

export function POST(_: Request, { params }: { params: Promise<{ idUsuario: string }> }) {
  return manejar(async () => {
    const { idUsuario } = await params;
    return exito(await desactivarCuenta(Number(idUsuario)));
  });
}
