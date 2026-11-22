
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompraProducto } from "@/components/catalogo/compra-producto";
import { Foto } from "@/components/ui/foto";
import { Insignia, Sobretitulo } from "@/components/ui/textos";
import { formatearColones } from "@/lib/formato";
import { obtenerProductoPorId } from "@/modules/catalogo-inventario/consultas";

async function ContenidoDetalle({
  params,
}: {
  params: Promise<{ idProducto: string }>;
}) {
  const { idProducto } = await params;

  if (!/^\d+$/.test(idProducto)) {
    notFound();
  }

  const id = Number(idProducto);

  if (!Number.isSafeInteger(id) || id <= 0) {
    notFound();
  }

  const datos = await obtenerProductoPorId(id);

  if (!datos) {
    notFound();
  }

  const { producto, categoria } = datos;
  const agotado = producto.existencias === 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-8 flex items-center gap-3 text-xs text-gris">
        <Link
          href="/catalogo"
          className="hover:text-naranja"
        >
          ← Volver
        </Link>

        <span className="h-4 w-px bg-borde" />

        <Link
          href="/catalogo"
          className="hover:text-naranja"
        >
          Instrumentos
        </Link>

        <span>/</span>

        <Link
          href={`/catalogo?categoria=${categoria.idCategoria}`}
          className="hover:text-naranja"
        >
          {categoria.nombre}
        </Link>

        <span>/</span>

        <span className="text-tinta">
          {producto.nombre}
        </span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        <Foto
          src={producto.imagenUrl}
          alt={producto.nombre}
          className="h-[460px]"
        />

        <div className="flex flex-col gap-6 lg:pt-6">
          <Sobretitulo>
            {categoria.nombre}
          </Sobretitulo>

          <h1 className="font-serif text-5xl">
            {producto.nombre}
          </h1>

          <div className="flex items-center gap-4 border-b border-borde pb-6">
            <span className="font-serif text-3xl">
              {formatearColones(producto.precio)}
            </span>

            <Insignia>
              {agotado
                ? "Agotado"
                : `${producto.existencias} disponibles`}
            </Insignia>
          </div>

          <p className="leading-relaxed text-gris">
            {producto.descripcion}
          </p>

          <CompraProducto producto={producto} />
        </div>
      </div>
    </div>
  );
}

export default function DetalleProducto({
  params,
}: PageProps<"/catalogo/[idProducto]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-12 text-gris">
          Cargando instrumento...
        </div>
      }
    >
      <ContenidoDetalle params={params} />
    </Suspense>
  );
}
