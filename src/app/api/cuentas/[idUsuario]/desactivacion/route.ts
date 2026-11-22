import { exito, manejar } from "@/lib/respuesta";
import { desactivarCuenta } from "@/modules/autenticacion-usuarios/service";

// POST /api/cuentas/{idUsuario}/desactivacion   Desactivar la cuenta                  RF-08
// Solo el Administrador del sistema. No permite desactivar la propia cuenta.

export function POST(_: Request, { params }: { params: Promise<{ idUsuario: string }> }) {
  return manejar(async () => {
    const { idUsuario } = await params;
    return exito(await desactivarCuenta(Number(idUsuario)));
  });
}
