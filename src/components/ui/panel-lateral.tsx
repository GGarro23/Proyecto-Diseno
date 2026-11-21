"use client";

import type { ReactNode } from "react";
import { Icono } from "./icono";
import { Sobretitulo } from "./textos";

export function PanelLateral({
  abierto,
  alCerrar,
  sobretitulo,
  titulo,
  children,
}: {
  abierto: boolean;
  alCerrar: () => void;
  sobretitulo: string;
  titulo: string;
  children: ReactNode;
}) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-tinta/50" onClick={alCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-papel text-tinta shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-borde px-10 py-8">
          <div>
            <Sobretitulo>{sobretitulo}</Sobretitulo>
            <h2 className="mt-2 font-serif text-4xl">{titulo}</h2>
          </div>
          <button onClick={alCerrar} aria-label="Cerrar" className="text-gris hover:text-tinta">
            <Icono nombre="cerrar" className="size-5" />
          </button>
        </div>
        <div className="px-10 py-8">{children}</div>
      </div>
    </div>
  );
}