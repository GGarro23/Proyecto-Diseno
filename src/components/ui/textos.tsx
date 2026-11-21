import type { ReactNode } from "react";

export function Sobretitulo({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja">
      {children}
    </p>
  );
}

export function Insignia({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-borde px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cafe">
      {children}
    </span>
  );
}