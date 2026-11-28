import { Suspense } from "react";
import { TarjetaCurso } from "@/components/academia/tarjeta-curso";
import { obtenerOfertaAcademica } from "@/modules/academia/consultas";

async function OfertaDesdeBD() {
  const cursos = await obtenerOfertaAcademica();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cursos.map((datos) => (
        <TarjetaCurso
          key={datos.curso.idCurso}
          curso={datos.curso}
          horarios={datos.horarios}
          profesor={datos.profesor ?? undefined}
          cuposDisponibles={datos.cuposDisponibles}
        />
      ))}
    </div>
  );
}

export default function Academia() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 text-center">

        <h1 className="mt-3 font-serif text-5xl">
          Tu música merece{" "}
          <em className="text-naranja">
            tiempo y guía
          </em>
        </h1>

        <p className="mt-3 text-gris">
          Grupos pequeños, docentes activos y un método
          que respeta tu propio ritmo.
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-center text-gris">
            Cargando oferta académica...
          </p>
        }
      >
        <OfertaDesdeBD />
      </Suspense>
    </div>
  );
}
