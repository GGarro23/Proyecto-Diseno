"use client";

import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { llamarApi } from "@/lib/api";
import { PERMISOS, ROLES_INTERNOS, type MatrizPermisos } from "@/modules/autenticacion-usuarios/permisos";
import type { NombreRol } from "@/modules/autenticacion-usuarios/schema";
import { usePermisos } from "./permisos";

export function PermisosSistema({ alAvisar }: { alAvisar: (texto: string) => void }) {
  const { dato: guardada, cargando, error, recargar } = usePermisos();
  const [guardando, setGuardando] = useState(false);
  const [borrador, setBorrador] = useState<MatrizPermisos | null>(null);
  const matriz = borrador ?? guardada;
  const hayCambios = borrador !== null && JSON.stringify(borrador) !== JSON.stringify(guardada);

  const alternar = (rol: NombreRol, codigo: string) => {
    const actuales = matriz[rol] ?? [];
    setBorrador({
      ...matriz,
      [rol]: actuales.includes(codigo) ? actuales.filter((c) => c !== codigo) : [...actuales, codigo],
    });
  };

  const guardar = async () => {
    if (!borrador) return;
    setGuardando(true);
    const resultado = await llamarApi<MatrizPermisos>("/api/permisos", "PUT", borrador);
    setGuardando(false);
    if (!resultado.ok) return alAvisar(resultado.error);
    setBorrador(null);
    recargar();
    alAvisar("Permisos guardados");
  };

  if (cargando) return <p className="py-12 text-center text-sm text-gris">Cargando permisos…</p>;
  if (error) return <p className="border border-borde bg-papel p-10 text-center text-red-700">{error}</p>;

  return (
    <section className="flex flex-col gap-6 border border-borde bg-papel p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl">Matriz de permisos</h2>
          <p className="mt-1 text-sm text-gris">Define qué operaciones puede realizar cada rol del personal.</p>
        </div>
        <div className="flex gap-3">
          {hayCambios && <Boton variante="secundario" onClick={() => setBorrador(null)}>Descartar</Boton>}
          <Boton onClick={guardar} disabled={!hayCambios || guardando}>Guardar cambios</Boton>
        </div>
      </div>

      <div className="overflow-x-auto border border-borde">
        <table className="w-full text-sm">
          <thead className="bg-crema text-xs uppercase tracking-wider text-gris">
            <tr>
              <th className="px-5 py-4 text-left font-medium">Funcionalidad</th>
              {ROLES_INTERNOS.map((r) => (
                <th key={r} className="px-5 py-4 text-center font-medium">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISOS.map((p) => (
              <tr key={p.codigo} className="border-t border-borde">
                <td className="px-5 py-4">{p.descripcion}</td>
                {ROLES_INTERNOS.map((r) => (
                  <td key={r} className="px-5 py-4 text-center">
                    <input
                      type="checkbox"
                      aria-label={`${p.descripcion}: ${r}`}
                      checked={matriz[r]?.includes(p.codigo) ?? false}
                      onChange={() => alternar(r, p.codigo)}
                      className="size-5 accent-cafe"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
