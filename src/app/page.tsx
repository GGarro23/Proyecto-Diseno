
import Link from "next/link";
import { Suspense } from "react";

import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { BotonEnlace } from "@/components/ui/boton";
import { Carrusel } from "@/components/ui/carrusel";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import { Sobretitulo } from "@/components/ui/textos";

import {
  obtenerCategorias,
  obtenerProductos,
} from "@/modules/catalogo-inventario/consultas";

import type {
  Categoria,
  Producto,
} from "@/modules/catalogo-inventario/schema";

const detalles: Record<
  string,
  { nota: string; texto: string }
> = {
  Cuerdas: {
    nota: "01",
    texto: "Instrumentos para contar historias",
  },
  Teclados: {
    nota: "02",
    texto: "Cada nota, una nueva posibilidad",
  },
  Vientos: {
    nota: "03",
    texto: "Dale aire a tu música",
  },
  Accesorios: {
    nota: "04",
    texto: "Los detalles que hacen la diferencia",
  },
};

function Presentacion() {
  return (
    <section className="relative overflow-hidden bg-[#f2ece4]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#cdb9a7_0.6px,transparent_0.6px)] [background-size:18px_18px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-12 md:px-10 lg:min-h-[620px] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:py-16">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-3 border-b border-[#cdb9a7] pb-3">
            <span
              className="h-1.5 w-1.5 rounded-full bg-naranja"
              aria-hidden="true"
            />

            <Sobretitulo>
              Tienda y academia musical · Costa Rica
            </Sobretitulo>
          </div>

          <h1 className="font-serif text-[clamp(3.6rem,7vw,7rem)] leading-[0.94] tracking-[-0.035em] text-tinta">
            Todo empieza
            <br />
            con una{" "}
            <em className="font-normal text-naranja">
              nota.
            </em>
          </h1>

          <p className="mt-8 max-w-lg border-l-2 border-naranja pl-5 text-base leading-8 text-gris md:text-lg">
            Encontrá el instrumento que va con vos y descubrí
            un espacio para aprender, explorar y hacer crecer
            tu música.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <BotonEnlace
              href="/catalogo"
              className="min-h-12 px-7 shadow-[0_10px_30px_rgba(184,80,26,0.16)]"
            >
              Explorar instrumentos
              <Icono nombre="flecha" />
            </BotonEnlace>

            <Link
              href="/academia"
              className="inline-flex min-h-12 items-center gap-2 border-b border-cafe px-1 text-sm font-medium text-cafe transition-colors hover:text-naranja"
            >
              Conocer la academia
              <Icono nombre="flecha" />
            </Link>
          </div>

          <div className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-[#dbcfc3] pt-6 text-xs leading-5 text-gris sm:text-sm">
            <p>
              <span className="mb-1 block font-serif text-2xl text-tinta">
                01.
              </span>
              Elegí tu sonido
            </p>

            <p>
              <span className="mb-1 block font-serif text-2xl text-tinta">
                02.
              </span>
              Aprendé a tu ritmo
            </p>

            <p>
              <span className="mb-1 block font-serif text-2xl text-tinta">
                03.
              </span>
              Seguí creciendo
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[570px] pb-6 pl-5 sm:pl-9 lg:pb-10">
          <div
            className="absolute inset-x-8 bottom-0 top-7 rotate-[3deg] border border-[#c9a98c]"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden bg-[#dac6b2] shadow-[0_24px_70px_rgba(59,43,34,0.17)]">
            <Foto
              src="/imagenes/productos/violin-atelier-v80.webp"
              alt="Violín de la colección de Intervallum"
              className="h-[420px] bg-[#d3c1ad] bg-contain bg-no-repeat sm:h-[510px]"
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cafe-oscuro/90 via-cafe-oscuro/35 to-transparent px-7 pb-7 pt-24 text-papel">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f7c69e]">
                Una invitación a crear
              </p>

              <p className="mt-2 max-w-xs font-serif text-3xl leading-tight">
                Tu próxima historia merece sonar.
              </p>
            </div>
          </div>

          <div className="absolute -bottom-1 -left-1 hidden border-l-[3px] border-naranja bg-papel px-6 py-4 shadow-lg sm:block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-naranja">
              Intervallum
            </span>

            <p className="mt-1 font-serif text-xl text-tinta">
              La música nos reúne.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Categorias({
  categorias,
}: {
  categorias: Categoria[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Sobretitulo>
            01 / Descubrí nuestra selección
          </Sobretitulo>

          <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
            Encontrá tu sonido
            <span className="text-naranja">.</span>
          </h2>

          <p className="mt-3 text-sm text-gris">
            Explorá las categorías disponibles en nuestra
            tienda.
          </p>
        </div>

        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 border-b border-cafe pb-2 text-sm font-medium transition-colors hover:text-naranja"
        >
          Todo el catálogo
          <Icono nombre="flecha" />
        </Link>
      </div>

      {categorias.length === 0 ? (
        <p className="mt-8 rounded border border-borde bg-papel p-6 text-sm text-gris">
          Todavía no hay categorías publicadas.
        </p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categorias.map((categoria, indice) => (
            <Link
              key={categoria.idCategoria}
              href={`/catalogo?categoria=${categoria.idCategoria}`}
              className="group relative flex min-h-[230px] flex-col overflow-hidden border border-borde bg-papel p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#c99c7a] hover:shadow-[0_14px_35px_rgba(59,43,34,0.08)]"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs tracking-widest text-naranja">
                  {detalles[categoria.nombre]?.nota ??
                    String(indice + 1).padStart(2, "0")}
                </span>

                <span className="flex size-9 items-center justify-center rounded-full border border-borde transition-colors group-hover:border-naranja group-hover:bg-naranja group-hover:text-papel">
                  <Icono nombre="flecha" />
                </span>
              </div>

              <span
                className="pointer-events-none absolute right-4 top-14 font-serif text-[95px] leading-none text-[#f1e9df] transition-transform duration-300 group-hover:translate-x-2"
                aria-hidden="true"
              >
                ♪
              </span>

              <div className="relative mt-auto">
                <h3 className="font-serif text-3xl">
                  {categoria.nombre}
                </h3>

                <p className="mt-2 max-w-[200px] text-xs leading-5 text-gris">
                  {detalles[categoria.nombre]?.texto ??
                    "Descubrí nuestra selección"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Destacados({
  productos,
  categorias,
}: {
  productos: Producto[];
  categorias: Categoria[];
}) {
  const activos = productos.filter(
    (producto) => producto.activo
  );

  return (
    <section className="bg-[#f4efe8] py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <Sobretitulo>
              02 / Para tu próxima melodía
            </Sobretitulo>

            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              Instrumentos que inspiran
              <span className="text-naranja">.</span>
            </h2>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-naranja"
          >
            Explorar productos
            <Icono nombre="flecha" />
          </Link>
        </div>

        {activos.length === 0 ? (
          <p className="border border-borde bg-papel p-6 text-sm text-gris">
            Todavía no hay productos disponibles.
          </p>
        ) : (
          <Carrusel total={activos.length}>
            {activos.map((producto) => (
              <TarjetaProducto
                key={producto.idProducto}
                producto={producto}
                categoria={categorias.find(
                  (categoria) =>
                    categoria.idCategoria ===
                    producto.idCategoria
                )}
                className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-4.5rem)/4)]"
              />
            ))}
          </Carrusel>
        )}
      </div>
    </section>
  );
}

function Academia() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
      <div className="grid overflow-hidden bg-cafe-oscuro lg:grid-cols-2">
        <div className="relative min-h-[350px] overflow-hidden bg-[#d5bd9f] lg:min-h-[520px]">
          <Foto
            src="/imagenes/cursos/piano-inicial.webp"
            alt="Piano para el aprendizaje musical"
            className="absolute inset-0 h-full w-full bg-cover bg-center"
          />

          <div className="absolute left-6 top-6 border border-papel/70 bg-cafe-oscuro/65 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-papel backdrop-blur-sm">
            Academia Intervallum
          </div>
        </div>

        <div className="flex flex-col justify-center px-8 py-12 text-papel sm:px-12 lg:px-14 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#efab79]">
            03 / Aprendé con nosotros
          </p>

          <h2 className="mt-6 font-serif text-[clamp(2.8rem,4.5vw,4.7rem)] leading-[1.04]">
            La música también se{" "}
            <em className="font-normal text-[#e6ab83]">
              aprende.
            </em>
          </h2>

          <p className="mt-7 max-w-lg text-sm leading-8 text-papel/75 md:text-base">
            Cada gran interpretación comienza con la
            curiosidad. Conocé nuestros cursos, descubrí sus
            horarios y encontrá tu próximo desafío musical.
          </p>

          <div className="my-8 h-px bg-papel/20" />

          <div className="mb-9 grid grid-cols-2 gap-6 text-sm text-papel/75">
            <p>
              <span className="mb-1 block font-serif text-2xl text-papel">
                Explorá
              </span>
              la oferta académica
            </p>

            <p>
              <span className="mb-1 block font-serif text-2xl text-papel">
                Inscribite
              </span>
              según cupos disponibles
            </p>
          </div>

          <BotonEnlace
            href="/academia"
            variante="secundario"
            className="self-start px-7"
          >
            Descubrir cursos
            <Icono nombre="flecha" />
          </BotonEnlace>
        </div>
      </div>
    </section>
  );
}

function Cierre() {
  return (
    <section className="border-t border-borde bg-papel px-6 py-14 text-center md:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-naranja">
        Intervallum · Tienda y academia
      </p>

      <p className="mx-auto mt-4 max-w-2xl font-serif text-3xl leading-snug md:text-4xl">
        Un espacio para quienes viven la música y para
        quienes están por descubrirla.
      </p>

      <Link
        href="/catalogo"
        className="mt-7 inline-flex items-center gap-2 border-b border-naranja pb-1 text-sm font-medium text-naranja hover:text-naranja-oscuro"
      >
        Empezar a explorar
        <Icono nombre="flecha" />
      </Link>
    </section>
  );
}

async function CatalogoInicio() {
  const [productos, categorias] = await Promise.all([
    obtenerProductos(),
    obtenerCategorias(),
  ]);

  return (
    <>
      <Categorias categorias={categorias} />

      <Destacados
        productos={productos}
        categorias={categorias}
      />
    </>
  );
}

export default function Inicio() {
  return (
    <>
      <Presentacion />

      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-6 py-20 text-center text-sm text-gris">
            Cargando instrumentos y categorías...
          </div>
        }
      >
        <CatalogoInicio />
      </Suspense>

      <Academia />

      <Cierre />
    </>
  );
}
