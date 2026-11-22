"use client";

import type { ReactNode } from "react";
import { Icono } from "./icono";

export function Modal({ abierto, alCerrar, children }: { abierto: boolean; alCerrar: () => void; children: ReactNode }) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 p-6" onClick={alCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-papel p-10 text-tinta shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={alCerrar} aria-label="Cerrar" className="absolute right-5 top-5 text-gris hover:text-tinta">
          <Icono nombre="cerrar" className="size-5" />
        </button>
        {children}
      </div>
    </div>
  );
}