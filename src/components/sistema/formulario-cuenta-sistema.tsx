"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { llamarApi } from "@/lib/api";
import type { Cuenta, NombreRol } from "@/modules/autenticacion-usuarios/schema";
import {
  ROLES,
  validarConfirmacion,
  validarContrasena,
  validarCorreo,
  validarNombrePersona,
  validarRoles,
  type ErroresCuenta,
} from "@/modules/autenticacion-usuarios/validaciones";

export function FormularioCuentaSistema({
  cuenta,
  idSolicitante,
  alTerminar,
  alCancelar,
}: {
  cuenta: Cuenta | null;
  idSolicitante: number;
  alTerminar: (texto: string) => void;
  alCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(cuenta?.usuario.nombre ?? "");
  const [correo, setCorreo] = useState(cuenta?.usuario.correo ?? "");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [roles, setRoles] = useState<NombreRol[]>(cuenta?.roles ?? []);
  const [errores, setErrores] = useState<ErroresCuenta>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const alternarRol = (rol: NombreRol) =>
    setRoles((actuales) => (actuales.includes(rol) ? actuales.filter((r) => r !== rol) : [...actuales, rol]));

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const encontrados: ErroresCuenta = {};
    const errorNombre = validarNombrePersona(nombre);
    const errorCorreo = validarCorreo(correo);
    const errorContrasena = cuenta ? undefined : validarContrasena(contrasena, correo);
    const errorConfirmacion = cuenta ? undefined : validarConfirmacion(contrasena, confirmacion);
    if (errorNombre) encontrados.nombre = errorNombre;
    if (errorCorreo) encontrados.correo = errorCorreo;
    if (errorContrasena) encontrados.contrasena = errorContrasena;
    if (errorConfirmacion) encontrados.confirmacion = errorConfirmacion;
    setErrores(encontrados);
    const errorRoles = validarRoles(roles);
    if (errorRoles) return setError(errorRoles);
    if (Object.keys(encontrados).length > 0) return;
    if (cuenta && cuenta.usuario.idUsuario === idSolicitante && !roles.includes("Administrador del sistema")) {
      return setError("No puedes quitarte el rol Administrador del sistema.");
    }

    setEnviando(true);
    const resultado = cuenta
      ? await llamarApi<Cuenta>(`/api/cuentas/${cuenta.usuario.idUsuario}`, "PUT", { nombre, correo, roles })
      : await llamarApi<Cuenta>("/api/cuentas", "POST", { nombre, correo, contrasena, roles });
    setEnviando(false);
    if (!resultado.ok) {
      setErrores(resultado.errores ?? {});
      return setError(resultado.error);
    }
    alTerminar(cuenta ? `Cuenta actualizada: ${resultado.dato.usuario.nombre}` : `Cuenta registrada: ${resultado.dato.usuario.nombre}`);
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Campo etiqueta="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} maxLength={100} />
      <Campo etiqueta="Correo electrónico" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} maxLength={254} />
      {!cuenta && (
        <Campo
          etiqueta="Contraseña inicial"
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          error={errores.contrasena}
          placeholder="Mínimo 8 caracteres, con letras y números"
          autoComplete="new-password"
          maxLength={72}
        />
      )}
      {!cuenta && (
        <Campo
          etiqueta="Confirmar contraseña"
          type="password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          error={errores.confirmacion}
          autoComplete="new-password"
          maxLength={72}
        />
      )}

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-2">Roles</legend>
        {ROLES.map((rol) => (
          <label key={rol} className="flex items-center gap-3">
            <input type="checkbox" checked={roles.includes(rol)} onChange={() => alternarRol(rol)} className="size-4 accent-cafe" />
            {rol}
          </label>
        ))}
      </fieldset>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-3">
        <Boton type="button" variante="secundario" onClick={alCancelar} className="rounded-md">Cancelar</Boton>
        <Boton type="submit" disabled={enviando} className="rounded-md">{cuenta ? "Guardar cambios" : "Registrar cuenta"}</Boton>
      </div>
    </form>
  );
}
