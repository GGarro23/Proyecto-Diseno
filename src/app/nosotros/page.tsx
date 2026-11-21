import { BotonEnlace } from "@/components/ui/boton";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import { Sobretitulo } from "@/components/ui/textos";

// Textos tomados del documento de visión (Problema, Contexto y Usuarios). Sin prototipo en el documento.
const SERVICIOS = [
  {
    titulo: "Tienda",
    texto:
      "Comercializamos instrumentos y accesorios musicales. Puedes consultar los productos disponibles, comprarlos en línea y elegir entre envío a domicilio o retiro en la tienda.",
    enlace: { href: "/catalogo", texto: "Ver instrumentos" },
  },
  {
    titulo: "Academia",
    texto:
      "Ofrecemos clases de instrumentos y cursos de teoría y lectura musical. Consulta la oferta, sus horarios y los cupos disponibles para inscribirte.",
    enlace: { href: "/academia", texto: "Ver cursos" },
  },
];

const PUBLICO = [
  "Estudiantes de música",
  "Músicos profesionales y aficionados",
  "Agrupaciones y organizaciones musicales",
  "Personas que quieren aprender un instrumento, teoría o lectura musical",
];

export default function Nosotros() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Sobretitulo>Nosotros</Sobretitulo>
          <h1 className="font-serif text-6xl leading-tight">
            Una tienda y academia
            <br />
            <em className="text-naranja">hecha de música</em>
          </h1>
          <p className="max-w-md leading-relaxed text-gris">
            Intervallum es una tienda y academia musical dedicada a la venta de instrumentos y accesorios musicales, así como a la
            enseñanza de instrumentos, lectura y teoría musical.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -bottom-4 -right-4 left-4 top-4 border border-borde" aria-hidden />
          <Foto src="/img/nosotros/tienda.jpg" alt="Instrumentos en la tienda Intervallum" className="relative h-[380px]" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <Sobretitulo>Lo que hacemos</Sobretitulo>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {SERVICIOS.map((s) => (
            <article key={s.titulo} className="flex flex-col gap-4 border border-borde bg-papel p-8">
              <h2 className="font-serif text-4xl">{s.titulo}</h2>
              <p className="leading-relaxed text-gris">{s.texto}</p>
              <BotonEnlace href={s.enlace.href} variante="secundario" className="mt-auto self-start">
                {s.enlace.texto} <Icono nombre="flecha" />
              </BotonEnlace>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-16 mt-10 max-w-6xl px-6">
        <div className="grid gap-10 bg-cafe px-12 py-12 text-papel lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja-claro">Para quién</p>
            <h2 className="mt-3 font-serif text-5xl leading-tight">
              Para todas las personas
              <br />
              <em className="text-papel/50">que viven la música</em>
            </h2>
          </div>
          <ul className="flex flex-col justify-center gap-4">
            {PUBLICO.map((p) => (
              <li key={p} className="border-l-2 border-naranja pl-4 text-papel/90">{p}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}