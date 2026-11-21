"use client";

import { useCallback, useState } from "react";
import { useOferta } from "@/components/academia/oferta";
import { useInventario } from "@/components/inventario/inventario";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Icono } from "@/components/ui/icono";
import { Insignia, Sobretitulo } from "@/components/ui/textos";
import { nombreDeUsuario } from "@/mocks/autenticacion";
import { generarPromocion, generarReabastecimiento, marcarRevisada } from "@/mocks/recomendaciones";
import type { Recomendacion } from "@/modules/agente-apoyo/schema";
import { useRecomendaciones } from "./recomendaciones";

const FILTROS = ["Pendientes", "Revisadas", "Todas"] as const;

// Recomendaciones del agente de apoyo (Figura 32, RF-45 a RF-48)
export function RecomendacionesAdmin() {
  const { sesion } = useSesion();
  const recomendaciones = useRecomendaciones();
  const { productos } = useInventario();
  const { cursos } = useOferta();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Pendientes");
  const [aviso, setAviso] = useState<string | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  if (!sesion) return null;

  const pendientes = recomendaciones.filter((r) => r.estado === "Pendiente").length;
  const visibles = recomendaciones
    .filter((r) => filtro === "Todas" || (filtro === "Pendientes" ? r.estado === "Pendiente" : r.estado === "Revisada"))
    .sort((a, b) => b.fechaGeneracion.localeCompare(a.fechaGeneracion) || b.idRecomendacion - a.idRecomendacion);

  const elemento = (r: Recomendacion) =>
    r.tipo === "Reabastecimiento"
      ? productos.find((p) => p.idProducto === r.idProducto)?.nombre ?? `Producto ${r.idProducto}`
      : cursos.find((c) => c.idCurso === r.idCurso)?.nombre ?? `Curso ${r.idCurso}`;

  const generar = (tipo: Recomendacion["tipo"]) => {
    const resultado = tipo === "Reabastecimiento" ? generarReabastecimiento() : generarPromocion();
    if (!resultado.ok) return setAviso(resultado.error);
    const n = resultado.dato.length;
    const texto = tipo === "Reabastecimiento" ? "de reabastecimiento" : "de promoción académica";
    setAviso(n === 0 ? `No hay recomendaciones nuevas ${texto}` : `${n} ${n === 1 ? "recomendación nueva" : "recomendaciones nuevas"} ${texto}`);
    if (n > 0) setFiltro("Pendientes");
  };

  const revisar = (r: Recomendacion) => {
    const resultado = marcarRevisada(r.idRecomendacion, sesion.usuario.idUsuario);
    setAviso(resultado.ok ? `Recomendación sobre ${elemento(r)} marcada como revisada` : resultado.error);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>Administración · Agente de apoyo</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          Recomendaciones para <em className="text-naranja">revisar</em>
        </h1>
        <p className="mt-2 text-gris">
          {pendientes} {pendientes === 1 ? "recomendación pendiente" : "recomendaciones pendientes"}. El agente solo sugiere; no cambia
          inventario ni cursos.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`border px-4 py-2 text-sm ${f === filtro ? "border-cafe bg-cafe text-papel" : "border-borde bg-papel hover:border-cafe"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Boton variante="secundario" onClick={() => generar("Promoción académica")}>Generar promoción académica</Boton>
          <Boton onClick={() => generar("Reabastecimiento")}>Generar reabastecimiento</Boton>
        </div>
      </div>

      <section className="border border-borde bg-papel px-7">
        {visibles.length === 0 ? (
          <p className="py-12 text-center text-gris">
            {filtro === "Revisadas" ? "Todavía no hay recomendaciones revisadas." : "No hay recomendaciones. Usa los botones para que el agente las genere."}
          </p>
        ) : (
          <ul>
            {visibles.map((r) => (
              <li key={r.idRecomendacion} className="flex flex-wrap items-center gap-6 border-b border-borde py-6 last:border-b-0">
                <span className="flex size-14 shrink-0 items-center justify-center bg-naranja-claro text-cafe">
                  <Icono nombre={r.tipo === "Reabastecimiento" ? "caja" : "libro"} className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <Insignia>{r.tipo}</Insignia>
                  <h2 className="mt-2 font-serif text-2xl">{elemento(r)}</h2>
                  <p className="mt-1 text-sm text-gris">{r.motivo}</p>
                  <p className="mt-1 text-xs text-gris">
                    Generada el {r.fechaGeneracion.slice(0, 10)}
                    {r.estado === "Revisada" && ` · Revisada el ${r.fechaRevision?.slice(0, 10)} por ${nombreDeUsuario(r.idRevisor!)}`}
                  </p>
                </div>
                {r.estado === "Pendiente" ? (
                  <Boton variante="secundario" onClick={() => revisar(r)}>Marcar revisada</Boton>
                ) : (
                  <span className="text-sm font-medium text-gris">Revisada</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Aviso texto={aviso} alCerrar={cerrarAviso} />
    </div>
  );
}