"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { asignarRoles, modificarCuenta, registrarCuentaInterna, type Cuenta } from "@/mocks/autenticacion";
import type { NombreRol } from "@/modules/autenticacion-usuarios/schema";
import { ROLES, validarRoles, type ErroresCuenta } from "@/modules/autenticacion-usuarios/validaciones";

// Registro de cuentas internas, modificación de cuentas y asignación de roles (RF-06, RF-07, RF-09).
// Sin prototipo en el documento.
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
  const [roles, setRoles] = useState<NombreRol[]>(cuenta?.roles ?? []);
  const [errores, setErrores] = useState<ErroresCuenta>({});
  const [error, setError] = useState<string | null>(null);

  const alternarRol = (rol: NombreRol) =>
    setRoles((actuales) => (actuales.includes(rol) ? actuales.filter((r) => r !== rol) : [...actuales, rol]));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const errorRoles = validarRoles(roles);
    if (errorRoles) return setError(errorRoles);

    if (!cuenta) {
      const resultado = registrarCuentaInterna({ nombre, correo, contrasena, roles });
      if (!resultado.ok) {
        setErrores(resultado.errores ?? {});
        return setError(resultado.error);
      }
      return alTerminar(`Cuenta registrada: ${resultado.dato.usuario.nombre}`);
    }

    // Los roles se validan antes para no guardar los datos a medias
    if (cuenta.usuario.idUsuario === idSolicitante && !roles.includes("Administrador del sistema")) {
      return setError("No puedes quitarte el rol Administrador del sistema.");
    }
    const datos = modificarCuenta(cuenta.usuario.idUsuario, { nombre, correo });
    if (!datos.ok) {
      setErrores(datos.errores ?? {});
      return setError(datos.error);
    }
    const asignacion = asignarRoles(cuenta.usuario.idUsuario, roles, idSolicitante);
    if (!asignacion.ok) return setError(asignacion.error);
    alTerminar(`Cuenta actualizada: ${datos.dato.usuario.nombre}`);
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Campo etiqueta="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} />
      <Campo etiqueta="Correo electrónico" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} />
      {!cuenta && (
        <Campo
          etiqueta="Contraseña inicial"
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          error={errores.contrasena}
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
        <Boton type="button" variante="secundario" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit">{cuenta ? "Guardar cambios" : "Registrar cuenta"}</Boton>
      </div>
    </form>
  );
}