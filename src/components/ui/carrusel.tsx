"use client";

import { useRef, type ReactNode } from "react";
import { Icono } from "./icono";

export function Carrusel({ children }: { children: ReactNode }) {
  const fila = useRef<HTMLDivElement>(null);

  const mover = (direccion: 1 | -1) => {
    const el = fila.current;
    if (el) el.scrollBy({ left: direccion * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-4 text-xs text-gris">
        <button onClick={() => mover(-1)} aria-label="Anterior" className="ml-2 border border-borde p-2 transition hover:border-cafe hover:shadow-md">
          <Icono nombre="flechaIzquierda" />
        </button>
        <button onClick={() => mover(1)} aria-label="Siguiente" className="border border-borde p-2 transition hover:border-cafe hover:shadow-md">
          <Icono nombre="flecha" />
        </button>
      </div>
      <div ref={fila} className="-mx-2 -mb-4 flex snap-x scroll-px-2 gap-6 overflow-x-auto px-2 pb-4 [scrollbar-:none]">
        {children}
      </div>
    </div>
  );
}