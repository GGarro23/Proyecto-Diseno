"use client";

import { useCallback, useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Sobretitulo } from "@/components/ui/textos";
import type { Sesion } from "@/modules/autenticacion-usuarios/schema";
import { CuentasSistema } from "./cuentas-sistema";
import { PermisosSistema } from "./permisos-sistema";

const VISTAS = ["Cuentas", "Roles y permisos"] as const;

// Panel del Administrador del sistema: cuentas, roles y permisos (Figura 40, RF-06 a RF-10)
export function PanelSistema({ sesion }: { sesion: Sesion }) {
  const [vista, setVista] = useState<(typeof VISTAS)[number]>("Cuentas");
  const [aviso, setAviso] = useState<string | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>Administración del sistema</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          {vista === "Cuentas" ? (
            <>
              Cuentas de <em className="text-naranja">usuario</em>
            </>
          ) : (
            <>
              Roles y <em className="text-naranja">permisos</em>
            </>
          )}
        </h1>
        <p className="mt-2 text-gris">Configura el acceso del equipo interno con precisión.</p>
      </div>

      <div className="flex gap-2">
        {VISTAS.map((v) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`border px-4 py-2 text-sm ${v === vista ? "border-cafe bg-cafe text-papel" : "border-borde bg-papel hover:border-cafe"}`}
          >
            {v}
          </button>
        ))}
      </div>

      {vista === "Cuentas" ? (
        <CuentasSistema idSolicitante={sesion.usuario.idUsuario} alAvisar={setAviso} />
      ) : (
        <PermisosSistema alAvisar={setAviso} />
      )}

      <Aviso texto={aviso} alCerrar={cerrarAviso} />
    </div>
  );
}