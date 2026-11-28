import Link from "next/link";
import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { BotonEnlace } from "@/components/ui/boton";
import { Carrusel } from "@/components/ui/carrusel";
import { Foto } from "@/components/ui/foto";
import { GaleriaPresentacion } from "@/components/inicio/galeria-presentacion";
import { Suspense } from "react";
import { Icono } from "@/components/ui/icono";
import { Sobretitulo } from "@/components/ui/textos";
import { obtenerCategorias, obtenerProductos } from "@/modules/catalogo-inventario/consultas";
import { obtenerCifrasAcademia } from "@/modules/academia/consultas";
import type { Categoria, Producto } from "@/modules/catalogo-inventario/schema";

function Presentacion() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <h1 className="font-serif text-6xl leading-tight">
          Donde la música
          <br />
          <em className="text-naranja">encuentra su espacio</em>
        </h1>
        <p className="max-w-md leading-relaxed text-gris">
          Instrumentos que inspiran. Formación que transforma. Una experiencia musical diseñada para
          acompañar cada etapa de tu camino.
        </p>
        <div className="flex items-center gap-8">
          <BotonEnlace href="/catalogo" className="rounded-md hover:shadow-md">
            Explorar instrumentos <Icono nombre="flecha" />
          </BotonEnlace>
          <Link href="/academia" className="border-b border-tinta pb-1 text-sm font-medium">
            Descubrir los cursos
          </Link>
        </div>
        <div className="relative -ml-16 h-8" aria-hidden>
          <span className="absolute -top-3 left-14 font-serif text-5xl text-borde">𝄞</span>
          <div className="flex h-full flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="h-px bg-borde" />
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -bottom-4 -right-4 left-4 top-4 border border-borde" aria-hidden />
        <GaleriaPresentacion className="relative h-[400px]" />
        <div className="absolute -left-8 bottom-6 border-l-2 border-naranja bg-papel px-6 py-5 shadow-sm">
          <Sobretitulo>Desde 2024</Sobretitulo>
          <p className="mt-2 font-serif text-lg leading-snug">
            Creando espacios para
            <br />
            que la música suceda.
          </p>
        </div>
      </div>
    </section>
  );
}

function Categorias({ categorias }: { categorias: Categoria[] }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <Sobretitulo>Explora el catálogo</Sobretitulo>
      <div className="mt-3 flex items-end justify-between">
        <h2 className="font-serif text-4xl">Instrumentos con carácter</h2>
        <Link href="/catalogo" className="flex items-center gap-2 text-sm font-medium hover:text-naranja">
          Ver catálogo <Icono nombre="flecha" className="size-4 text-naranja" />
        </Link>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categorias.map((c, i) => (
          <Link
            key={c.idCategoria}
            href={`/catalogo?categoria=${c.idCategoria}`}
            className="group flex h-48 flex-col border border-borde bg-papel p-6 transition hover:border-naranja hover:shadow-md"
          >
            <span className="text-xs text-gris">{String(i + 1).padStart(2, "0")}</span>
            <span className="mt-4 font-serif text-4xl text-naranja">{c.simbolo}</span>
            <span className="mt-auto font-serif text-2xl">{c.nombre}</span>
            <span className="mt-1 flex items-center justify-between text-xs text-gris">
              {c.descripcion}
              <Icono nombre="flecha" className="size-4 text-tinta group-hover:text-naranja" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Destacados({ productos, categorias }: { productos: Producto[]; categorias: Categoria[] }) {
  const activos = productos.filter((p) => p.activo);
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="font-serif text-4xl">Recomendaciones para explorar</h2>
      <div className="mt-4">
        <Carrusel>
          {activos.map((p) => (
            <TarjetaProducto
              key={p.idProducto}
              producto={p}
              categoria={categorias.find((c) => c.idCategoria === p.idCategoria)}
              className="w-[calc((100%-4.5rem)/4)] shrink-0 snap-start transition hover:shadow-md"
            />
          ))}
        </Carrusel>
      </div>
    </section>
  );
}

function Academia() {
  return (
    <section className="mx-auto mb-16 mt-10 grid max-w-6xl px-6 lg:grid-cols-2">
      <Foto src="/img/inicio/academia.jpg" alt="Violín y arco" className="min-h-[380px] bg-cafe-oscuro" />
      <div className="flex flex-col justify-center gap-5 bg-cafe px-12 py-12 text-papel">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja-claro">Academia Intervallum</p>
        <h2 className="font-serif text-5xl leading-tight">
          Aprende a expresarte,
          <br />
          <em className="text-papel/50">con una melodía.</em>
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-papel/80">
          Programas diseñados para cultivar técnica, pasión y confianza, guiados por músicos que
          enseñan desde la experiencia.
        </p>
        <Suspense fallback={<Cifras profesores="—" cursos="—" />}>
          <CifrasAcademia />
        </Suspense>
        <BotonEnlace href="/academia" variante="secundario" className="self-start rounded-md hover:shadow-md">
          Conocer la academia <Icono nombre="flecha" />
        </BotonEnlace>
      </div>
    </section>
  );
}

function Cifras({ profesores, cursos }: { profesores: string; cursos: string }) {
  return (
    <dl className="flex gap-8">
      {[
        [profesores, "Profesores"],
        [cursos, "Cursos activos"],
      ].map(([valor, texto]) => (
        <div key={texto} className="border-l-2 border-naranja pl-4">
          <dt className="font-serif text-2xl">{valor}</dt>
          <dd className="text-xs text-papel/70">{texto}</dd>
        </div>
      ))}
    </dl>
  );
}

async function CifrasAcademia() {
  const { profesores, cursosAbiertos } = await obtenerCifrasAcademia();
  return <Cifras profesores={String(profesores)} cursos={String(cursosAbiertos)} />;
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
          <div className="mx-auto max-w-6xl px-6 py-12">
            <p className="text-center text-gris">
              Cargando catálogo de instrumentos...
            </p>
          </div>
        }
      >
        <CatalogoInicio />
      </Suspense>

      <Academia />

    </>
  );
}