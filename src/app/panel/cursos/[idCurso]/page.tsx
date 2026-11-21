import { CursoAsignado } from "@/components/profesor/curso-asignado";
import { cursos } from "@/mocks/cursos";

// Mientras los datos vengan de mocks, las páginas se generan de antemano
export function generateStaticParams() {
  return cursos.map((c) => ({ idCurso: String(c.idCurso) }));
}

// Curso asignado al Profesor (Figuras 25 y 26)
export default async function PaginaCursoAsignado({ params }: PageProps<"/panel/cursos/[idCurso]">) {
  const { idCurso } = await params;
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <CursoAsignado idCurso={Number(idCurso)} />
    </div>
  );
}