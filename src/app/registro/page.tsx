import Link from "next/link";
import { FormularioRegistro } from "@/components/cuenta/formulario-registro";
import { MarcoCuenta } from "@/components/cuenta/marco-cuenta";

// Registro de Cliente (RF-01, CU-01). Sin prototipo: sigue el estilo de las demás pantallas.
export default function Registro() {
  return (
    <MarcoCuenta titulo="Crea tu" destacado="cuenta">
      <FormularioRegistro />
      <p className="mt-6 text-center text-sm text-gris">
        ¿Ya tienes cuenta?{" "}
        <Link href="/iniciar-sesion" className="font-medium text-naranja hover:underline">Inicia sesión</Link>
      </p>
    </MarcoCuenta>
  );
}