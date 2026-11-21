"use client";

import { useInscripciones } from "@/components/academia/inscripciones";
import { BotonEnlace } from "@/components/ui/boton";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import { Insignia, Sobretitulo } from "@/components/ui/textos";
import { proximoHorario, textoProximaClase } from "@/lib/horarios";
import { useOferta } from "@/components/academia/oferta";
import type { Sesion } from "@/modules/autenticacion-usuarios/schema";

export function PanelProfesor({ sesion }: { sesion: Sesion }) {
  const inscripciones = useInscripciones();
  const { cursos, horarios, cargando, error } = useOferta();
  const asignados = cursos.filter((c) => c.idProfesor === sesion.usuario.idUsuario);
  const horariosAsignados = horarios.filter((h) => asignados.some((c) => c.idCurso === h.idCurso));
  const estudiantesDe = (idCurso: number) =>
    inscripciones.filter((i) => i.idCurso === idCurso && i.estado === "Activa").length;
  const abiertos = asignados.filter((c) => c.estado === "Abierto").length;
  const totalEstudiantes = asignados.reduce((suma, c) => suma + estudiantesDe(c.idCurso), 0);
  const proxima = proximoHorario(horariosAsignados.filter((h) => asignados.find((c) => c.idCurso === h.idCurso)?.estado === "Abierto"));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>Portal docente</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          Mis <em className="text-naranja">cursos</em>
        </h1>
        <p className="mt-2 text-gris">Organiza tus clases y acompaña el progreso de tus estudiantes.</p>
      </div>

      {cargando && <p className="text-sm text-gris">Cargando cursos asignados...</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="grid gap-5 md:grid-cols-3">
        <Indicador titulo="Cursos asignados" valor={String(asignados.length)} detalle={`${abiertos} ${abiertos === 1 ? "abierto" : "abiertos"}`} />
        <Indicador titulo="Estudiantes" valor={String(totalEstudiantes)} detalle="Con inscripción activa" />
        <Indicador
          titulo="Próxima clase"
          valor={proxima ? textoProximaClase(proxima) : "—"}
          detalle={proxima ? asignados.find((c) => c.idCurso === proxima.idCurso)?.nombre ?? "" : "Sin clases programadas"}
        />
      </div>

      <section>
        <h2 className="font-serif text-3xl">Cursos asignados</h2>
        {asignados.length === 0 ? (
          <p className="mt-4 text-gris">Todavía no tienes cursos asignados.</p>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {asignados.map((c) => (
              <article key={c.idCurso} className="flex flex-col border border-borde bg-papel">
                <Foto src={c.imagenUrl} alt={c.nombre} className="h-44" />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <Insignia>{c.estado}</Insignia>
                    <span className="text-xs text-gris">{estudiantesDe(c.idCurso)} estudiantes</span>
                  </div>
                  <h3 className="font-serif text-2xl">{c.nombre}</h3>
                  <ul className="flex flex-col gap-1 border-t border-borde pt-3 text-sm">
                    {horarios
                      .filter((h) => h.idCurso === c.idCurso)
                      .map((h) => (
                        <li key={h.idHorario} className="flex items-center gap-2">
                          <Icono nombre="calendario" className="size-4 text-naranja" />
                          {h.diaSemana} · {h.horaInicio}–{h.horaFin}
                        </li>
                      ))}
                  </ul>
                  <BotonEnlace href={`/panel/cursos/${c.idCurso}`} variante="secundario" className="mt-auto">
                    Ver mi curso
                  </BotonEnlace>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="border border-borde bg-papel p-6">
      <p className="text-sm text-gris">{titulo}</p>
      <p className="mt-3 font-serif text-4xl">{valor}</p>
      <p className="mt-2 text-xs text-gris">{detalle}</p>
    </div>
  );
}