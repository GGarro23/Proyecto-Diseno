"use client";

import Link from "next/link";
import { useAsistencias } from "@/components/academia/asistencias";
import { useInscripciones } from "@/components/academia/inscripciones";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import { Insignia, Sobretitulo } from "@/components/ui/textos";
import { DIAS, proximoHorario, textoProximaClase } from "@/lib/horarios";
import { useOferta } from "@/components/academia/oferta";
import type { Sesion } from "@/modules/autenticacion-usuarios/schema";
import { formatearFecha } from "@/lib/formato";

export function PanelEstudiante({ sesion }: { sesion: Sesion }) {
  const { cursos, horarios, nombresProfesores, cargando, error } = useOferta();
  const inscripciones = useInscripciones().filter((i) => i.idUsuario === sesion.usuario.idUsuario);
  const asistencias = useAsistencias();
  const activas = inscripciones.filter((i) => i.estado === "Activa");
  const horariosActivos = horarios.filter((h) => activas.some((i) => i.idCurso === h.idCurso));

  const proxima = proximoHorario(horariosActivos);

  const propias = asistencias.filter((a) => inscripciones.some((i) => i.idInscripcion === a.idInscripcion));
  const presentes = propias.filter((a) => a.estadoAsistencia === "Presente").length;

  const nombreCurso = (idCurso: number) => cursos.find((c) => c.idCurso === idCurso)?.nombre ?? "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>Portal del estudiante</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          Mi espacio <em className="text-naranja">musical</em>
        </h1>
        <p className="mt-2 text-gris">Hola, {sesion.usuario.nombre.split(" ")[0]}. Tu semana musical, en un solo lugar.</p>
      </div>

      {cargando && <p className="text-sm text-gris">Cargando tus cursos...</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="grid gap-5 md:grid-cols-3">
        <Indicador titulo="Cursos activos" valor={String(activas.length)} detalle={`${inscripciones.length} ${inscripciones.length === 1 ? "inscripción" : "inscripciones"} en total`} />
        <Indicador
          titulo="Próxima clase"
          valor={proxima ? textoProximaClase(proxima) : "—"}
          detalle={proxima ? nombreCurso(proxima.idCurso) : "Sin cursos activos"}
        />
        <Indicador
          titulo="Asistencia"
          valor={propias.length ? `${Math.round((presentes / propias.length) * 100)}%` : "—"}
          detalle={propias.length ? `${presentes} de ${propias.length} sesiones` : "Sin sesiones registradas"}
        />
      </div>

      <section className="border border-borde bg-papel p-7">
        <h2 className="font-serif text-3xl">Mi semana</h2>
        <div className="mt-5 grid grid-cols-7 border-l border-t border-borde">
          {DIAS.map((dia) => (
            <div key={dia} className="min-h-36 border-b border-r border-borde p-3">
              <p className="text-xs font-medium">{dia}</p>
              {horariosActivos
                .filter((h) => h.diaSemana === dia)
                .map((h) => (
                  <div key={h.idHorario} className="mt-3 border-l-2 border-naranja bg-naranja-claro p-2">
                    <p className="text-xs text-gris">{h.horaInicio}</p>
                    <p className="font-serif text-base leading-tight">{nombreCurso(h.idCurso)}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </section>

      <section>
        <Sobretitulo>Aprendizaje</Sobretitulo>
        <h2 className="mt-2 font-serif text-3xl">Mis cursos</h2>
        {inscripciones.length === 0 ? (
          <p className="mt-4 text-gris">
            Todavía no tienes inscripciones. <Link href="/academia" className="text-naranja hover:underline">Ver oferta académica</Link>
          </p>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {inscripciones.map((i) => {
              const curso = cursos.find((c) => c.idCurso === i.idCurso);
              if (!curso) return null;
              return (
                <article key={i.idInscripcion} className="flex flex-col border border-borde bg-papel">
                  <Foto src={curso.imagenUrl} alt={curso.nombre} className="h-40" />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div>
                      <Insignia>{i.estado}</Insignia>
                    </div>
                    <h3 className="font-serif text-2xl">{curso.nombre}</h3>
                    <p className="text-sm text-gris">con {curso.idProfesor === null ? "Sin asignar" : nombresProfesores[curso.idProfesor] ?? "Profesor"}</p>
                    <p className="text-xs text-gris">Inscrito el {formatearFecha(i.fechaInscripcion)}</p>
                    <Link href={`/academia/${curso.idCurso}`} className="mt-auto flex items-center gap-2 pt-2 text-sm font-medium hover:text-naranja">
                      Ver curso <Icono nombre="flecha" />
                    </Link>
                  </div>
                </article>
              );
            })}
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