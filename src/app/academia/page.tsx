import { TarjetaCurso } from "@/components/academia/tarjeta-curso";
import { Sobretitulo } from "@/components/ui/textos";
import { cursos, horarios } from "@/mocks/cursos";
import { profesores } from "@/mocks/usuarios";

// Oferta académica (Figura 17, RF-35, RF-36, CU-13)
export default function Academia() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 text-center">
        <Sobretitulo>Academia Intervallum</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          Tu música merece <em className="text-naranja">tiempo y guía</em>
        </h1>
        <p className="mt-3 text-gris">Grupos pequeños, docentes activos y un método que respeta tu propio ritmo.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cursos.map((c) => (
          <TarjetaCurso
            key={c.idCurso}
            curso={c}
            horarios={horarios.filter((h) => h.idCurso === c.idCurso)}
            profesor={profesores.find((p) => p.idUsuario === c.idProfesor)?.nombre}
          />
        ))}
      </div>
    </div>
  );
}