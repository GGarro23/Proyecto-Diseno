import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoCurso } from "@/components/academia/estado-curso";
import { InscripcionCurso } from "@/components/academia/inscripcion-curso";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import { Sobretitulo } from "@/components/ui/textos";
import { cursos, horarios } from "@/mocks/cursos";
import { profesores } from "@/mocks/usuarios";

// Mientras los datos vengan de mocks, las páginas se generan de antemano
export function generateStaticParams() {
  return cursos.map((c) => ({ idCurso: String(c.idCurso) }));
}

// Detalle de curso (Figura 19, RF-35, RF-36, RF-37)
export default async function DetalleCurso({ params }: PageProps<"/academia/[idCurso]">) {
  const { idCurso } = await params;
  const curso = cursos.find((c) => c.idCurso === Number(idCurso));
  if (!curso) notFound();

  const horariosCurso = horarios.filter((h) => h.idCurso === curso.idCurso);
  const profesor = profesores.find((p) => p.idUsuario === curso.idProfesor);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-8 flex items-center gap-3 text-xs text-gris">
        <Link href="/academia" className="hover:text-naranja">← Volver</Link>
        <span className="h-4 w-px bg-borde" />
        <Link href="/academia" className="hover:text-naranja">Academia</Link>
        <span>/</span>
        <span className="text-tinta">{curso.nombre}</span>
      </nav>

      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <Foto src={curso.imagenUrl} alt={curso.nombre} className="min-h-[380px]" />
        <div className="flex flex-col justify-center gap-5 bg-cafe px-12 py-12 text-papel">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja-claro">Academia Intervallum</p>
          <h1 className="font-serif text-5xl">{curso.nombre}</h1>
          {profesor && <p className="text-papel/80">con {profesor.nombre}</p>}
          <div className="flex flex-wrap items-center gap-6 border-t border-papel/20 pt-5 text-sm">
            {horariosCurso.map((h) => (
              <span key={h.idHorario} className="flex items-center gap-2">
                <Icono nombre="calendario" className="size-4" />
                {h.diaSemana} · {h.horaInicio}–{h.horaFin}
              </span>
            ))}
            <EstadoCurso curso={curso} claro />
          </div>
          <InscripcionCurso curso={curso} horarios={horariosCurso} />
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="border border-borde bg-papel p-8">
          <Sobretitulo>Descripción</Sobretitulo>
          <p className="mt-4 leading-relaxed text-gris">{curso.descripcion}</p>
        </section>
        <section className="border border-borde bg-papel p-8">
          <Sobretitulo>Horarios</Sobretitulo>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gris">
              <tr>
                <th className="pb-2 font-medium">Día</th>
                <th className="pb-2 font-medium">Inicio</th>
                <th className="pb-2 font-medium">Fin</th>
              </tr>
            </thead>
            <tbody>
              {horariosCurso.map((h) => (
                <tr key={h.idHorario} className="border-t border-borde">
                  <td className="py-3">{h.diaSemana}</td>
                  <td className="py-3">{h.horaInicio}</td>
                  <td className="py-3">{h.horaFin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}