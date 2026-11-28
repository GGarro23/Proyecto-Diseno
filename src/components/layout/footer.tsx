import Link from "next/link";
import { Icono, type NombreIcono } from "@/components/ui/icono";
import { EnlacesCuenta } from "./enlaces-cuenta";

const SECCIONES = [
  {
    titulo: "Explora",
    enlaces: [
      { texto: "Instrumentos", href: "/catalogo" },
      { texto: "Academia", href: "/academia" },
      { texto: "Nosotros", href: "/nosotros" },
      { texto: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
    ],
  },
];

const LEGALES = [
  { texto: "Privacidad", href: "/privacidad" },
  { texto: "Términos y condiciones", href: "/terminos" },
  { texto: "Cookies", href: "/cookies" },
];

const CONTACTO: { icono: NombreIcono; texto: string; href?: string }[] = [
  { icono: "correo", texto: "intervallum123@gmail.com", href: "mailto:intervallum123@gmail.com" },
  { icono: "telefono", texto: "+506 7293-0517", href: "tel:+50672930517" },
  { icono: "ubicacion", texto: "Alajuela, Costa Rica" },
  { icono: "reloj", texto: "Lunes a sábado · 9:00 – 18:00" },
];

export function PiePagina() {
  return (
    <footer className="bg-tinta text-papel/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.5fr]">
        <div className="flex flex-col gap-4">
          <p className="font-serif text-2xl tracking-[0.25em] text-papel">INTERVALLUM</p>
          <p className="text-sm leading-relaxed">
            Tienda y academia musical en Costa Rica desde 2024. Instrumentos, accesorios y cursos
            para cada etapa de tu camino musical.
          </p>
        </div>

        {SECCIONES.map((seccion) => (
          <nav key={seccion.titulo} aria-label={seccion.titulo} className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja">{seccion.titulo}</p>
            <ul className="flex flex-col gap-2 text-sm">
              {seccion.enlaces.map((enlace) => (
                <li key={enlace.href}>
                  <Link href={enlace.href} className="transition-colors hover:text-papel">
                    {enlace.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <nav aria-label="Tu cuenta" className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja">Tu cuenta</p>
          <EnlacesCuenta />
        </nav>

        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja">Contacto</p>
          <ul className="flex flex-col gap-3 text-sm">
            {CONTACTO.map((dato) => (
              <li key={dato.texto} className="flex items-center gap-3">
                <Icono nombre={dato.icono} className="size-4 shrink-0 text-naranja" />
                {dato.href ? (
                  <a href={dato.href} className="transition-colors hover:text-papel">
                    {dato.texto}
                  </a>
                ) : (
                  dato.texto
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-papel/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs md:flex-row md:justify-between">
          <p>© 2026 Intervallum. Todos los derechos reservados.</p>
          <nav aria-label="Documentos legales" className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGALES.map((enlace) => (
              <Link key={enlace.href} href={enlace.href} className="transition-colors hover:text-papel">
                {enlace.texto}
              </Link>
            ))}
          </nav>
          <p>Envíos a casi todo el país · Retiro en tienda</p>
        </div>
      </div>
    </footer>
  );
}