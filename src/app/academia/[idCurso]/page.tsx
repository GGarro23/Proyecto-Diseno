import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EstadoCurso } from "@/components/academia/estado-curso";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import { Sobretitulo } from "@/components/ui/textos";

import {
  obtenerCursoPorId,
} from "@/modules/academia/consultas";

async function ContenidoCurso({
  params,
}: {
  params: Promise<{ idCurso: string }>;
}) {
  const { idCurso } = await params;

  // Validar que recibimos un identificador válido.
  if (!/^[1-9]\d*$/.test(idCurso)) {
    notFound();
  }

  const id = Number(idCurso);

  if (!Number.isSafeInteger(id)) {
    notFound();
  }

  const datos = await obtenerCursoPorId(id);

  if (!datos) {
    notFound();
  }

  const {
    curso,
    horarios,
    profesor,
    cuposDisponibles,
  } = datos;

  const puedeInscribirse =
    curso.estado === "Abierto" &&
    cuposDisponibles > 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-8 flex items-center gap-3 text-xs text-gris">
        <Link
          href="/academia"
          className="hover:text-naranja"
        >
          ← Volver
        </Link>

        <span className="h-4 w-px bg-borde" />

        <Link
          href="/academia"
          className="hover:text-naranja"
        >
          Academia
        </Link>

        <span>/</span>

        <span className="text-tinta">
          {curso.nombre}
        </span>
      </nav>

      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <Foto
          src={curso.imagenUrl}
          alt={curso.nombre}
          className="min-h-[380px]"
        />

        <div className="flex flex-col justify-center gap-5 bg-cafe px-12 py-12 text-papel">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja-claro">
            Academia Intervallum
          </p>

          <h1 className="font-serif text-5xl">
            {curso.nombre}
          </h1>

          {profesor && (
            <p className="text-papel/80">
              con {profesor}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 border-t border-papel/20 pt-5 text-sm">
            {horarios.map((h) => (
              <span
                key={h.idHorario}
                className="flex items-center gap-2"
              >
                <Icono
                  nombre="calendario"
                  className="size-4"
                />

                {h.diaSemana} ·{" "}
                {h.horaInicio}–{h.horaFin}
              </span>
            ))}

            <EstadoCurso
              curso={curso}
              cuposDisponibles={cuposDisponibles}
              claro
            />
          </div>

          {/* La matrícula real se implementará
              después de la autenticación. */}
          <button
            type="button"
            disabled
            className="self-start cursor-not-allowed bg-papel/20 px-6 py-3 text-sm font-medium text-papel/80"
          >
            {!puedeInscribirse
              ? curso.estado === "Cerrado"
                ? "Curso cerrado"
                : "Sin cupos disponibles"
              : "Inscripciones próximamente"}
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="border border-borde bg-papel p-8">
          <Sobretitulo>
            Descripción
          </Sobretitulo>

          <p className="mt-4 leading-relaxed text-gris">
            {curso.descripcion}
          </p>
        </section>

        <section className="border border-borde bg-papel p-8">
          <Sobretitulo>
            Horarios
          </Sobretitulo>

          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gris">
              <tr>
                <th className="pb-2 font-medium">
                  Día
                </th>
                <th className="pb-2 font-medium">
                  Inicio
                </th>
                <th className="pb-2 font-medium">
                  Fin
                </th>
              </tr>
            </thead>

            <tbody>
              {horarios.map((h) => (
                <tr
                  key={h.idHorario}
                  className="border-t border-borde"
                >
                  <td className="py-3">
                    {h.diaSemana}
                  </td>
                  <td className="py-3">
                    {h.horaInicio}
                  </td>
                  <td className="py-3">
                    {h.horaFin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default function DetalleCurso({
  params,
}: PageProps<"/academia/[idCurso]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-12 text-gris">
          Cargando información del curso...
        </div>
      }
    >
      <ContenidoCurso params={params} />
    </Suspense>
  );
}
