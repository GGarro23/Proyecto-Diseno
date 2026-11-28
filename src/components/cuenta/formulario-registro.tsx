"use client";

import { useState, type FormEvent } from "react";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campo";
import { PROVINCIAS } from "@/lib/provincias";
import { validarRegistro, type ErroresCuenta } from "@/modules/autenticacion-usuarios/validaciones";

export function FormularioRegistro() {
  const { registrar } = useSesion();
  const [datos, setDatos] = useState({ nombre: "", correo: "", contrasena: "", confirmacion: "", telefono: "", provincia: "" });
  const [errores, setErrores] = useState<ErroresCuenta>({});
  const [registrado, setRegistrado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo: keyof typeof datos, valor: string) => {
    setDatos({ ...datos, [campo]: valor });
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const encontrados = validarRegistro(datos);
    if (Object.keys(encontrados).length > 0) return setErrores(encontrados);
    setEnviando(true);
    const resultado = await registrar({
      nombre: datos.nombre,
      correo: datos.correo,
      contrasena: datos.contrasena,
      telefono: datos.telefono,
      provincia: datos.provincia,
    });
    setEnviando(false);
    if (!resultado.ok) {
      setErrores(resultado.errores ?? {});
      return setError(resultado.errores ? null : resultado.error);
    }
    setRegistrado(true);
  };

  if (registrado) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-naranja-claro text-xl text-naranja">✓</span>
        <p className="text-gris">Tu cuenta se creó correctamente. Ya puedes iniciar sesión.</p>
        <BotonEnlace href="/iniciar-sesion" className="rounded-md">Iniciar sesión</BotonEnlace>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
      <Campo etiqueta="Nombre completo" value={datos.nombre} error={errores.nombre} onChange={(e) => cambiar("nombre", e.target.value)} autoComplete="name" maxLength={100} />
      <Campo etiqueta="Correo electrónico" type="email" value={datos.correo} error={errores.correo} onChange={(e) => cambiar("correo", e.target.value)} autoComplete="email" maxLength={254} />
      <Campo
        etiqueta="Contraseña"
        type="password"
        value={datos.contrasena}
        error={errores.contrasena}
        onChange={(e) => cambiar("contrasena", e.target.value)}
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres, con letras y números"
        maxLength={72}
      />
      <Campo
        etiqueta="Confirmar contraseña"
        type="password"
        value={datos.confirmacion}
        error={errores.confirmacion}
        onChange={(e) => cambiar("confirmacion", e.target.value)}
        autoComplete="new-password"
        maxLength={72}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Teléfono (opcional)" type="tel" inputMode="tel" placeholder="8888-8888" value={datos.telefono} error={errores.telefono} onChange={(e) => cambiar("telefono", e.target.value)} autoComplete="tel" maxLength={16} />
        <Selector etiqueta="Provincia (opcional)" value={datos.provincia} error={errores.provincia} onChange={(e) => cambiar("provincia", e.target.value)}>
          <option value="">Sin indicar</option>
          {PROVINCIAS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Selector>
      </div>
      {error && <p className="text-sm text-red-800">{error}</p>}
      <Boton type="submit" disabled={enviando} className="rounded-md">{enviando ? "Creando cuenta…" : "Crear cuenta"}</Boton>
    </form>
  );
}