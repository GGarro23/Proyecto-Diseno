import Link from "next/link";
import { BotonEnlace } from "@/components/ui/boton";
import { Icono } from "@/components/ui/icono";
import { Sobretitulo } from "@/components/ui/textos";

const DESTINOS = [
  { href: "/catalogo", titulo: "Instrumentos", texto: "Explora el catálogo de la tienda" },
  { href: "/academia", titulo: "Academia", texto: "Conoce los cursos disponibles" },
  { href: "/preguntas-frecuentes", titulo: "Ayuda", texto: "Revisa las preguntas frecuentes" },
];

export default function NoEncontrada() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-20 text-center">
      <div className="relative">
        <span className="font-serif text-[9rem] leading-none text-borde" aria-hidden>
          404
        </span>
        <span className="absolute -right-6 top-2 font-serif text-6xl text-naranja" aria-hidden>
          ♪
        </span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Sobretitulo>Página no encontrada</Sobretitulo>
        <h1 className="font-serif text-5xl">
          Esta nota se salió del <em className="text-naranja">pentagrama</em>
        </h1>
        <p className="max-w-md text-gris">
          La página que buscas no existe, cambió de dirección o ya no está disponible. Revisa la dirección o
          sigue por alguno de estos caminos.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {DESTINOS.map((destino) => (
          <Link
            key={destino.href}
            href={destino.href}
            className="group flex flex-col gap-1 rounded-md border border-borde bg-papel p-5 text-left transition hover:border-naranja hover:shadow-md"
          >
            <span className="flex items-center justify-between font-serif text-2xl">
              {destino.titulo}
              <Icono nombre="flecha" className="size-4 group-hover:text-naranja" />
            </span>
            <span className="text-sm text-gris">{destino.texto}</span>
          </Link>
        ))}
      </div>

      <BotonEnlace href="/" className="rounded-md hover:shadow-md">
        Volver al inicio
      </BotonEnlace>
    </div>
  );
}
