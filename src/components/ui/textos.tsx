import type { ReactNode } from "react";

// Texto pequeño en mayúsculas sobre los títulos: "COMPRA SEGURA · SIMULACIÓN ACADÉMICA"
export function Sobretitulo({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja">
      {children}
    </p>
  );
}

// Etiqueta redondeada: roles, modalidad de entrega, nivel del curso
export function Insignia({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-borde px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cafe">
      {children}
    </span>
  );
}