import Link from "next/link";
import type { ReactNode } from "react";

export type Seccion = { titulo: string; contenido: ReactNode };

const DOCUMENTOS = [
  { href: "/preguntas-frecuentes", texto: "Preguntas frecuentes" },
  { href: "/privacidad", texto: "Política de privacidad" },
  { href: "/terminos", texto: "Términos y condiciones" },
  { href: "/cookies", texto: "Política de cookies" },
];

export function Documento({
  titulo,
  destacado,
  actualizado,
  introduccion,
  secciones,
  ruta,
}: {
  titulo: string;
  destacado: string;
  actualizado?: string;
  introduccion: ReactNode;
  secciones: Seccion[];
  ruta: string;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[14rem_1fr]">
      <nav aria-label="Ayuda y documentos legales" className="flex h-fit flex-col gap-1 lg:sticky lg:top-24">
        {DOCUMENTOS.map((documento) => (
          <Link
            key={documento.href}
            href={documento.href}
            aria-current={documento.href === ruta ? "page" : undefined}
            className={`rounded-md px-4 py-2 text-sm transition-colors ${
              documento.href === ruta ? "bg-cafe text-papel" : "text-gris hover:bg-crema hover:text-tinta"
            }`}
          >
            {documento.texto}
          </Link>
        ))}
      </nav>

      <article className="flex max-w-3xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="font-serif text-5xl">
            {titulo} <em className="text-naranja">{destacado}</em>
          </h1>
          {actualizado && <p className="text-xs text-gris">Última actualización: {actualizado}</p>}
          <div className="leading-relaxed text-gris">{introduccion}</div>
        </header>

        {secciones.map((seccion, indice) => (
          <section key={seccion.titulo} className="flex flex-col gap-3 border-t border-borde pt-6">
            <h2 className="font-serif text-2xl">
              <span className="mr-3 text-naranja">{String(indice + 1).padStart(2, "0")}</span>
              {seccion.titulo}
            </h2>
            <div className="flex flex-col gap-3 leading-relaxed text-gris [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-tinta">
              {seccion.contenido}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}
