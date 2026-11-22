import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CursoAsignadoProfesor } from "@/components/profesor/curso-asignado-profesor";

async function Contenido({ params }: { params: Promise<{ idCurso: string }> }) {
  const { idCurso } = await params;
  const id = Number(idCurso);
  if (!/^[1-9]\d*$/.test(idCurso) || !Number.isSafeInteger(id)) notFound();
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <CursoAsignadoProfesor idCurso={id} />
    </div>
  );
}

export default function PaginaCursoAsignado({ params }: PageProps<"/panel/cursos/[idCurso]">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-6 py-10 text-gris">Cargando curso...</p>}>
      <Contenido params={params} />
    </Suspense>
  );
}
