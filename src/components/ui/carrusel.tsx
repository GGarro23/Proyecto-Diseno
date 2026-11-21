"use client";

import { useRef, type ReactNode } from "react";
import { Icono } from "./icono";

// Fila deslizable con flechas y contador "01 —— 05" (Figuras 09 y 10)
export function Carrusel({ total, children }: { total: number; children: ReactNode }) {
  const fila = useRef<HTMLDivElement>(null);

  const mover = (direccion: 1 | -1) => {
    const el = fila.current;
    if (el) el.scrollBy({ left: direccion * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-4 text-xs text-gris">
        <span>01</span>
        <span className="h-px w-8 bg-gris" />
        <span>{String(total).padStart(2, "0")}</span>
        <button onClick={() => mover(-1)} aria-label="Anterior" className="ml-2 border border-borde p-2 hover:border-cafe">
          <Icono nombre="flechaIzquierda" />
        </button>
        <button onClick={() => mover(1)} aria-label="Siguiente" className="border border-tinta p-2 hover:bg-tinta hover:text-papel">
          <Icono nombre="flecha" />
        </button>
      </div>
      <div ref={fila} className="flex snap-x gap-6 overflow-x-auto [scrollbar-width:none]">
        {children}
      </div>
    </div>
  );
}