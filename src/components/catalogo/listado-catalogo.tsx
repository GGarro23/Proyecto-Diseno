
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Icono } from "@/components/ui/icono";
import { TarjetaProducto } from "./tarjeta-producto";

import type {
  Categoria,
  Producto,
} from "@/modules/catalogo-inventario/schema";

type Props = {
  productos: Producto[];
  categorias: Categoria[];
};

export function ListadoCatalogo({
  productos,
  categorias,
}: Props) {
  const parametros = useSearchParams();

  const [busqueda, setBusqueda] = useState("");

  const categoriaParametro = Number(
    parametros.get("categoria")
  );

  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<number | null>(
      categoriaParametro > 0 ? categoriaParametro : null
    );

  const texto = busqueda.trim().toLowerCase();

  // Mantener únicamente productos activos.
  const productosActivos = productos.filter(
    (producto) => producto.activo
  );

  // Búsqueda y filtrado.
  const resultados = productosActivos.filter(
    (producto) => {
      const coincideCategoria =
        categoriaSeleccionada === null ||
        producto.idCategoria === categoriaSeleccionada;

      const coincideBusqueda =
        producto.nombre.toLowerCase().includes(texto);

      return coincideCategoria && coincideBusqueda;
    }
  );

  const categoriaActual = categorias.find(
    (categoria) =>
      categoria.idCategoria === categoriaSeleccionada
  );

  function limpiarFiltros() {
    setBusqueda("");
    setCategoriaSeleccionada(null);
  }

  function estiloCategoria(activa: boolean) {
    return [
      "inline-flex min-h-11 items-center gap-2",
      "border px-5 py-2.5 text-sm",
      "transition-all duration-200",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-naranja",
      activa
        ? "border-cafe bg-cafe text-papel shadow-sm"
        : "border-borde bg-papel text-tinta hover:border-naranja hover:text-naranja",
    ].join(" ");
  }

  return (
    <div className="flex flex-col gap-9">
      {/* PANEL DE FILTROS */}

      <div className="border border-borde bg-[#f9f6f1] p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-naranja">
              Encontrá lo que buscás
            </p>

            <h3 className="mt-2 font-serif text-2xl">
              Filtrá tu selección
            </h3>
          </div>

          {(busqueda !== "" ||
            categoriaSeleccionada !== null) && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="border-b border-cafe pb-1 text-xs font-medium text-cafe transition-colors hover:text-naranja"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* BÚSQUEDA */}

        <label className="flex min-h-14 items-center gap-4 border border-borde bg-white px-5 transition-colors focus-within:border-naranja">
          <Icono
            nombre="buscar"
            className="size-5 shrink-0 text-naranja"
          />

          <input
            type="search"
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(evento.target.value)
            }
            placeholder="Buscar instrumentos o accesorios..."
            aria-label="Buscar productos por nombre"
            className="w-full min-w-0 bg-transparent py-4 text-sm text-tinta outline-none placeholder:text-gris"
          />
        </label>

        {/* CATEGORÍAS */}

        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-gris">
            Categorías
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setCategoriaSeleccionada(null)
              }
              className={estiloCategoria(
                categoriaSeleccionada === null
              )}
              aria-pressed={
                categoriaSeleccionada === null
              }
            >
              Todos los instrumentos
            </button>

            {categorias.map((categoria) => (
              <button
                key={categoria.idCategoria}
                type="button"
                onClick={() =>
                  setCategoriaSeleccionada(
                    categoria.idCategoria
                  )
                }
                className={estiloCategoria(
                  categoriaSeleccionada ===
                    categoria.idCategoria
                )}
                aria-pressed={
                  categoriaSeleccionada ===
                  categoria.idCategoria
                }
              >
                {categoria.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ENCABEZADO DE RESULTADOS */}

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-borde pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja">
            Selección disponible
          </p>

          <h3 className="mt-2 font-serif text-3xl">
            {categoriaActual
              ? categoriaActual.nombre
              : "Todos los instrumentos"}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#efe4d8] font-serif text-lg text-cafe">
            {resultados.length}
          </span>

          <p className="text-sm text-gris">
            {resultados.length === 1
              ? "producto encontrado"
              : "productos encontrados"}
          </p>
        </div>
      </div>

      {/* CUADRÍCULA DE PRODUCTOS */}

      {resultados.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resultados.map((producto) => (
            <TarjetaProducto
              key={producto.idProducto}
              producto={producto}
              categoria={categorias.find(
                (categoria) =>
                  categoria.idCategoria ===
                  producto.idCategoria
              )}
              className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-[#c99c7a] hover:shadow-[0_14px_35px_rgba(59,43,34,0.08)]"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center border border-borde bg-[#f9f6f1] px-6 py-16 text-center">
          <span
            className="font-serif text-7xl text-[#d9c1ab]"
            aria-hidden="true"
          >
            ♫
          </span>

          <h3 className="mt-4 font-serif text-3xl">
            No encontramos instrumentos
          </h3>

          <p className="mt-3 max-w-md text-sm leading-7 text-gris">
            Probá con otro nombre o seleccioná una categoría
            diferente para explorar nuestros productos.
          </p>

          <button
            type="button"
            onClick={limpiarFiltros}
            className="mt-7 border border-cafe bg-cafe px-6 py-3 text-sm font-medium text-papel transition-colors hover:bg-cafe-oscuro"
          >
            Ver todos los instrumentos
          </button>
        </div>
      )}
    </div>
  );
}
