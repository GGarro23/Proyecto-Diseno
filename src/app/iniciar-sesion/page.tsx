import Link from "next/link";
import { Suspense } from "react";
import { FormularioAcceso } from "@/components/cuenta/formulario-acceso";
import { MarcoCuenta } from "@/components/cuenta/marco-cuenta";

// Inicio de sesión (RF-02, CU-02). Sin prototipo: sigue el estilo de las demás pantallas.
export default function IniciarSesion() {
  return (
    <MarcoCuenta titulo="Bienvenido de" destacado="nuevo">
      <Suspense>
        <FormularioAcceso />
      </Suspense>
      <p className="mt-6 border-t border-borde pt-4 text-xs text-gris">
        Usuarios de prueba: ana@, carlos@, mariana@, pedidos@, admin@ y sistema@intervallum.cr, con la contraseña
        Intervallum1. <Link href="/registro" className="underline">O crea una cuenta.</Link>
      </p>
    </MarcoCuenta>
  );
}