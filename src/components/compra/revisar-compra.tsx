"use client";

import { useState } from "react";
import { useCarrito } from "@/components/carrito/proveedor-carrito";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import { formatearColones } from "@/lib/formato";
import { categorias } from "@/mocks/categorias";
import { buscarProducto } from "@/mocks/compra-simulada";

// Paso 1: revisar el carrito (Figura 13, RF-21, RF-22)
export function PasoRevisar() {
  const { lineas, cambiarCantidad, eliminar } = useCarrito();
  const [errores, setErrores] = useState<Record<number, string>>({});

  const cambiar = (idProducto: number, cantidad: number) => {
    const producto = buscarProducto(idProducto);
    if (!producto) return;
    const error = cambiarCantidad(producto, cantidad);
    setErrores((previos) => ({ ...previos, [idProducto]: error ?? "" }));
  };

  return (
    <ul className="flex flex-col">
      {lineas.map((l) => {
        const producto = buscarProducto(l.idProducto);
        if (!producto) return null;
        const categoria = categorias.find((c) => c.idCategoria === producto.idCategoria);
        return (
          <li key={l.idProducto} className="flex items-center gap-5 border-b border-borde py-5 first:pt-0">
            <Foto src={producto.imagenUrl} alt={producto.nombre} className="size-24 shrink-0" />
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.2em] text-naranja">{categoria?.nombre}</span>
              <span className="font-serif text-xl">{producto.nombre}</span>
              <button onClick={() => eliminar(l.idProducto)} className="self-start text-xs text-red-800 hover:underline">
                Eliminar
              </button>
              {errores[l.idProducto] && <span className="text-xs text-red-800">{errores[l.idProducto]}</span>}
            </div>
            <div className="flex items-center border border-borde">
              <button onClick={() => cambiar(l.idProducto, l.cantidad - 1)} disabled={l.cantidad <= 1} aria-label="Quitar uno" className="px-3 py-2 disabled:text-borde">
                <Icono nombre="menos" />
              </button>
              <span className="w-6 text-center text-sm">{l.cantidad}</span>
              <button onClick={() => cambiar(l.idProducto, l.cantidad + 1)} disabled={l.cantidad >= producto.existencias} aria-label="Agregar uno" className="px-3 py-2 disabled:text-borde">
                <Icono nombre="mas" />
              </button>
            </div>
            <span className="w-28 text-right font-serif text-xl">
              {formatearColones(producto.precio * l.cantidad)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}