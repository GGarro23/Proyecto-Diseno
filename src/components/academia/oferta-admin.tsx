"use client";

import { useCallback, useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { PanelLateral } from "@/components/ui/panel-lateral";
import { Sobretitulo } from "@/components/ui/textos";
import { DIAS } from "@/lib/horarios";
import { profesores } from "@/mocks/usuarios";
import { ocupacionCurso } from "@/modules/reportes/reportes";
import { FormularioCursoAdmin } from "./formulario-curso-admin";
import { HorariosCursoAdmin } from "./horarios-curso-admin";
import { useInscripciones } from "./inscripciones";
import { useOferta } from "./oferta";
import { ProfesorCursoAdmin } from "./profesor-curso-admin";

type Panel = { clase: "curso" | "horarios" | "profesor"; idCurso: number | null };

// Administración de cursos, horarios y profesores (RF-30 a RF-34). Sin prototipo en el documento.
export function OfertaAdmin() {
  const { cursos, horarios } = useOferta();
  const inscripciones = useInscripciones();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  const cursoPanel = cursos.find((c) => c.idCurso === panel?.idCurso) ?? null;
  const abiertos = cursos.filter((c) => c.estado === "Abierto").length;
  const sinProfesor = cursos.filter((c) => c.idProfesor === null).length;

  const terminar = (texto: string) => {
    setPanel(null);
    setAviso(texto);
  };

  const titulos: Record<Panel["clase"], string> = {
    curso: cursoPanel ? "Editar curso" : "Registrar curso",
    horarios: `Horarios de ${cursoPanel?.nombre ?? ""}`,
    profesor: "Asignar profesor",
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Sobretitulo>Administración · Academia</Sobretitulo>
          <h1 className="mt-3 font-serif text-5xl">
            Oferta <em className="text-naranja">académica</em>
          </h1>
          <p className="mt-2 text-gris">
            {cursos.length} cursos · {abiertos} {abiertos === 1 ? "abierto" : "abiertos"}
            {sinProfesor > 0 && ` · ${sinProfesor} sin profesor`}
          </p>
        </div>
        <Boton onClick={() => setPanel({ clase: "curso", idCurso: null })}>Registrar curso</Boton>
      </div>

      <section className="overflow-x-auto border border-borde bg-papel">
        <table className="w-full text-sm">
          <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
            <tr>
              <th className="px-5 py-3 font-medium">Curso</th>
              <th className="px-5 py-3 font-medium">Profesor</th>
              <th className="px-5 py-3 font-medium">Horarios</th>
              <th className="px-5 py-3 text-right font-medium">Inscritos</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((c) => {
              const { inscritos } = ocupacionCurso(c, inscripciones);
              const propios = horarios
                .filter((h) => h.idCurso === c.idCurso)
                .sort((a, b) => DIAS.indexOf(a.diaSemana) - DIAS.indexOf(b.diaSemana) || a.horaInicio.localeCompare(b.horaInicio));
              const profesor = profesores.find((p) => p.idUsuario === c.idProfesor);
              return (
                <tr key={c.idCurso} className={`border-t border-borde align-top ${c.estado === "Cerrado" ? "text-gris" : ""}`}>
                  <td className="px-5 py-4">
                    <p className="font-serif text-lg">{c.nombre}</p>
                    <p className="mt-1 max-w-xs text-xs text-gris">{c.descripcion}</p>
                  </td>
                  <td className="px-5 py-4">{profesor?.nombre ?? <span className="text-naranja">Sin asignar</span>}</td>
                  <td className="px-5 py-4">
                    {propios.length === 0 ? (
                      <span className="text-naranja">Sin horarios</span>
                    ) : (
                      propios.map((h) => (
                        <p key={h.idHorario} className="whitespace-nowrap">
                          {h.diaSemana} · {h.horaInicio} a {h.horaFin}
                        </p>
                      ))
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {inscritos} / {c.cupoMaximo}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${
                        c.estado === "Abierto" ? "border-borde text-cafe" : "border-borde bg-crema text-gris"
                      }`}
                    >
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-end gap-1 text-sm">
                      <button onClick={() => setPanel({ clase: "curso", idCurso: c.idCurso })} className="text-naranja hover:underline">
                        Editar curso
                      </button>
                      <button onClick={() => setPanel({ clase: "horarios", idCurso: c.idCurso })} className="text-naranja hover:underline">
                        Horarios
                      </button>
                      <button onClick={() => setPanel({ clase: "profesor", idCurso: c.idCurso })} className="text-naranja hover:underline">
                        Asignar profesor
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <PanelLateral abierto={panel !== null} alCerrar={() => setPanel(null)} sobretitulo="Academia" titulo={panel ? titulos[panel.clase] : ""}>
        {panel?.clase === "curso" && (
          <FormularioCursoAdmin curso={cursoPanel} alTerminar={terminar} alCancelar={() => setPanel(null)} />
        )}
        {panel?.clase === "horarios" && cursoPanel && (
          <HorariosCursoAdmin idCurso={cursoPanel.idCurso} horarios={horarios} alAvisar={setAviso} />
        )}
        {panel?.clase === "profesor" && cursoPanel && (
          <ProfesorCursoAdmin curso={cursoPanel} alTerminar={terminar} alCancelar={() => setPanel(null)} />
        )}
      </PanelLateral>

      <Aviso texto={aviso} alCerrar={cerrarAviso} />
    </div>
  );
}