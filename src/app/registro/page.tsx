import Link from "next/link";
import { FormularioRegistro } from "@/components/cuenta/formulario-registro";
import { MarcoCuenta } from "@/components/cuenta/marco-cuenta";
import { Suspense } from "react";
import { RedireccionCuenta } from "@/components/cuenta/redireccion-cuenta";

export default function Registro() {
  return (
    <MarcoCuenta titulo="Crea tu" destacado="cuenta">
      <Suspense>
        <RedireccionCuenta />
      </Suspense>
      
      <FormularioRegistro />

      <p className="mt-6 text-center text-sm text-gris">
        ¿Ya tienes cuenta?{" "}
        <Link href="/iniciar-sesion" className="font-medium text-naranja hover:underline">Inicia sesión</Link>
      </p>
    </MarcoCuenta>
  );
}