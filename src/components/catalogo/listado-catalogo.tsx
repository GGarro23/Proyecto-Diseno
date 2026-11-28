"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icono } from "@/components/ui/icono";
import type { Categoria, Producto } from "@/modules/catalogo-inventario/schema";
import { TarjetaProducto } from "./tarjeta-producto";

export function ListadoCatalogo({ productos, categorias }: { productos: Producto[]; categorias: Categoria[] }) {
  const parametros = useSearchParams();
  const [busqueda, setBusqueda] = useState("");
  const [idCategoria, setIdCategoria] = useState<number | null>(
    Number(parametros.get("categoria")) || null
  );

  const texto = busqueda.trim().toLowerCase();
  const resultados = productos.filter(
    (p) =>
      p.activo &&
      (idCategoria === null || p.idCategoria === idCategoria) &&
      p.nombre.toLowerCase().includes(texto)
  );

  const chip = (activo: boolean) =>
    `rounded-full border px-4 py-2 text-sm ${
      activo ? "border-cafe bg-cafe text-papel" : "border-borde bg-papel hover:border-cafe"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <label className="flex items-center gap-3 rounded-md border border-borde bg-papel px-4 focus-within:border-cafe">
        <Icono nombre="buscar" className="size-5 text-gris" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar instrumentos o accesorios…"
          className="w-full bg-transparent py-4 text-sm outline-none"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setIdCategoria(null)} className={chip(idCategoria === null)}>
          Todos
        </button>
        {categorias.map((c) => (
          <button key={c.idCategoria} onClick={() => setIdCategoria(c.idCategoria)} className={chip(idCategoria === c.idCategoria)}>
            {c.nombre}
          </button>
        ))}
      </div>

      <p className="text-xs text-gris">
        {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
      </p>

      {resultados.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {resultados.map((p) => (
            <TarjetaProducto
              key={p.idProducto}
              producto={p}
              categoria={categorias.find((c) => c.idCategoria === p.idCategoria)}
            />
          ))}
        </div>
      ) : (
        <p className="border border-borde bg-papel p-10 text-center text-sm text-gris">
          No hay productos que coincidan con la búsqueda.
        </p>
      )}
    </div>
  );
}