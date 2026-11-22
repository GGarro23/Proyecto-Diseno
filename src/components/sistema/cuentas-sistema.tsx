"use client";

import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Icono } from "@/components/ui/icono";
import { Modal } from "@/components/ui/modal";
import { PanelLateral } from "@/components/ui/panel-lateral";
import { Insignia } from "@/components/ui/textos";
import { llamarApi } from "@/lib/api";
import type { Cuenta } from "@/modules/autenticacion-usuarios/schema";
import { useCuentas } from "./cuentas";
import { FormularioCuentaSistema } from "./formulario-cuenta-sistema";

// Cuentas de usuario: registro, modificación, desactivación y roles (RF-06 a RF-09).
// Sin prototipo en el documento.
export function CuentasSistema({ idSolicitante, alAvisar }: { idSolicitante: number; alAvisar: (texto: string) => void }) {
  const { dato: cuentas, cargando, error, recargar } = useCuentas();
  const [busqueda, setBusqueda] = useState("");
  const [panel, setPanel] = useState<{ idUsuario: number | null } | null>(null);
  const [idDesactivar, setIdDesactivar] = useState<number | null>(null);

  const texto = busqueda.trim().toLowerCase();
  const visibles = cuentas.filter(
    (c) => !texto || c.usuario.nombre.toLowerCase().includes(texto) || c.usuario.correo.toLowerCase().includes(texto)
  );
  const cuentaPanel = cuentas.find((c) => c.usuario.idUsuario === panel?.idUsuario) ?? null;
  const cuentaDesactivar = cuentas.find((c) => c.usuario.idUsuario === idDesactivar);

  const terminar = (texto: string) => {
    setPanel(null);
    recargar();
    alAvisar(texto);
  };

  const confirmarDesactivar = async () => {
    if (idDesactivar === null) return;
    const resultado = await llamarApi<Cuenta>(`/api/cuentas/${idDesactivar}/desactivacion`, "POST");
    setIdDesactivar(null);
    if (resultado.ok) recargar();
    alAvisar(resultado.ok ? `Cuenta desactivada: ${resultado.dato.usuario.nombre}` : resultado.error);
  };

  if (cargando) return <p className="py-12 text-center text-sm text-gris">Cargando cuentas…</p>;
  if (error) return <p className="border border-borde bg-papel p-10 text-center text-red-700">{error}</p>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex min-w-72 flex-1 items-center gap-3 border border-borde bg-white px-4">
          <Icono nombre="buscar" className="size-4 text-gris" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full py-3 text-sm outline-none"
          />
        </label>
        <Boton onClick={() => setPanel({ idUsuario: null })}>Registrar cuenta interna</Boton>
      </div>

      <section className="overflow-x-auto border border-borde bg-papel">
        <table className="w-full text-sm">
          <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
            <tr>
              <th className="px-5 py-3 font-medium">Cuenta</th>
              <th className="px-5 py-3 font-medium">Roles</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Registro</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((c) => (
              <tr key={c.usuario.idUsuario} className={`border-t border-borde ${c.usuario.activo ? "" : "text-gris"}`}>
                <td className="px-5 py-4">
                  <p className="font-medium">{c.usuario.nombre}</p>
                  <p className="text-xs text-gris">{c.usuario.correo}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {c.roles.map((r) => (
                      <Insignia key={r}>{r}</Insignia>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">{c.usuario.activo ? "Activa" : "Desactivada"}</td>
                <td className="px-5 py-4 text-gris">{c.usuario.fechaRegistro}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => setPanel({ idUsuario: c.usuario.idUsuario })} className="text-naranja hover:underline">
                      Editar
                    </button>
                    {c.usuario.activo && c.usuario.idUsuario !== idSolicitante && (
                      <button onClick={() => setIdDesactivar(c.usuario.idUsuario)} className="text-naranja hover:underline">
                        Desactivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && <p className="p-10 text-center text-gris">No hay cuentas que coincidan con la búsqueda.</p>}
      </section>

      <PanelLateral
        abierto={panel !== null}
        alCerrar={() => setPanel(null)}
        sobretitulo="Cuentas de usuario"
        titulo={cuentaPanel ? "Editar cuenta" : "Registrar cuenta interna"}
      >
        <FormularioCuentaSistema cuenta={cuentaPanel} idSolicitante={idSolicitante} alTerminar={terminar} alCancelar={() => setPanel(null)} />
      </PanelLateral>

      <Modal abierto={cuentaDesactivar !== undefined} alCerrar={() => setIdDesactivar(null)}>
        <h2 className="font-serif text-3xl">¿Desactivar la cuenta de {cuentaDesactivar?.usuario.nombre}?</h2>
        <p className="mt-3 text-sm text-gris">
          No podrá iniciar sesión. Sus pedidos, inscripciones y demás registros se conservan.
        </p>
        <div className="mt-8 flex justify-end gap-3">
          <Boton variante="secundario" onClick={() => setIdDesactivar(null)}>Cancelar</Boton>
          <Boton onClick={confirmarDesactivar}>Desactivar</Boton>
        </div>
      </Modal>
    </div>
  );
}
