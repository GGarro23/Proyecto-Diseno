
import Link from "next/link";
import { Suspense } from "react";

import { ListadoCatalogo } from "@/components/catalogo/listado-catalogo";
import { Icono } from "@/components/ui/icono";

import {
  obtenerProductos,
  obtenerCategorias,
} from "@/modules/catalogo-inventario/consultas";

async function CatalogoDesdeBD() {
  const [productos, categorias] = await Promise.all([
    obtenerProductos(),
    obtenerCategorias(),
  ]);

  return (
    <ListadoCatalogo
      productos={productos}
      categorias={categorias}
    />
  );
}

export default function Catalogo() {
  return (
    <main className="min-h-screen">
      {/* ENCABEZADO */}

      <section className="relative overflow-hidden bg-[#f2ece4]">
        <div
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#cdb9a7_0.6px,transparent_0.6px)] [background-size:18px_18px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-12 md:px-10 md:pb-20 md:pt-16">
          {/* NAVEGACIÓN */}

          <div className="mb-10 flex items-center gap-3 text-xs text-gris">
            <Link
              href="/"
              className="transition-colors hover:text-naranja"
            >
              Inicio
            </Link>

            <span>/</span>

            <span className="font-medium text-cafe">
              Instrumentos
            </span>
          </div>

          <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-3 border-b border-[#cdb9a7] pb-3">
                <span className="size-1.5 rounded-full bg-naranja" />

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cafe">
                  Tienda Intervallum
                </p>
              </div>

              <h1 className="max-w-3xl font-serif text-[clamp(3.5rem,7vw,6.5rem)] leading-[0.98] tracking-[-0.035em] text-tinta">
                Encontrá tu
                <br />
                próximo{" "}
                <em className="font-normal text-naranja">
                  instrumento.
                </em>
              </h1>

              <p className="mt-7 max-w-xl border-l-2 border-naranja pl-5 text-base leading-8 text-gris">
                Cada instrumento tiene una historia.
                Explorá nuestra selección de instrumentos
                musicales y accesorios, y encontrá el
                sonido que te acompañará.
              </p>
            </div>

            {/* ELEMENTO DECORATIVO */}

            <div className="relative hidden min-h-[240px] items-center justify-center lg:flex">
              <span
                className="absolute font-serif text-[260px] leading-none text-[#e2d2c2]"
                aria-hidden="true"
              >
                ♪
              </span>

              <div className="relative z-10 max-w-[260px] border-l-2 border-naranja bg-papel/85 px-7 py-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja">
                  Nuestra filosofía
                </p>

                <p className="mt-3 font-serif text-2xl leading-snug text-tinta">
                  La música empieza con la curiosidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LISTADO REAL DE PRODUCTOS */}

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja">
              01 / Colección musical
            </p>

            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              Explorá nuestro catálogo
              <span className="text-naranja">.</span>
            </h2>

            <p className="mt-3 text-sm text-gris">
              Buscá por nombre o elegí una categoría para
              descubrir los productos disponibles.
            </p>
          </div>

          <Link
            href="/academia"
            className="inline-flex items-center gap-2 border-b border-cafe pb-2 text-sm font-medium transition-colors hover:text-naranja"
          >
            Conocer la academia
            <Icono nombre="flecha" />
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="border border-borde bg-papel px-6 py-16 text-center text-sm text-gris">
              Cargando instrumentos...
            </div>
          }
        >
          <CatalogoDesdeBD />
        </Suspense>
      </section>

      {/* INVITACIÓN A LA ACADEMIA */}

      <section className="bg-cafe-oscuro px-6 py-16 text-papel md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#efab79]">
              Más que instrumentos
            </p>

            <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight md:text-4xl">
              El instrumento es el comienzo.
              <br />
              <em className="font-normal text-[#e6ab83]">
                La música la hacés vos.
              </em>
            </h2>
          </div>

          <Link
            href="/academia"
            className="inline-flex min-h-12 items-center gap-3 border border-papel/50 px-6 py-3 text-sm font-medium transition-all hover:border-papel hover:bg-papel hover:text-cafe-oscuro"
          >
            Explorar cursos
            <Icono nombre="flecha" />
          </Link>
        </div>
      </section>
    </main>
  );
}
