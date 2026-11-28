import { redirect } from "next/navigation";
import { sesionActual } from "@/modules/autenticacion-usuarios/service";

export async function RedireccionCuenta() {
  if (await sesionActual()) redirect("/panel");
  return null;
}