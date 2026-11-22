"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";

// Formulario de inicio de sesión (RF-02, CU-02)
export function FormularioAcceso() {
  const { iniciarSesion } = useSesion();
  const router = useRouter();
  const volver = useSearchParams().get("volver") ?? "/";
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !contrasena) return setError("Completa el correo y la contraseña.");
    setEnviando(true);
    const resultado = await iniciarSesion(correo, contrasena);
    setEnviando(false);
    if (!resultado.ok) return setError(resultado.error);
    router.push(volver.startsWith("/") ? volver : "/");
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
      <Campo etiqueta="Correo electrónico" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" />
      <Campo etiqueta="Contraseña" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} autoComplete="current-password" />
      {error && <p className="text-sm text-red-800">{error}</p>}
      <Boton type="submit" disabled={enviando}>{enviando ? "Ingresando…" : "Iniciar sesión"}</Boton>
      <p className="text-center text-sm text-gris">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-naranja hover:underline">Regístrate</Link>
      </p>
      <Link href="/" className="text-center text-sm text-gris hover:text-naranja">Cancelar</Link>
    </form>
  );
}