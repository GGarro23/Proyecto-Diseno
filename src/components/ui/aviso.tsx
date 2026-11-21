"use client";

import { useEffect } from "react";

// Mensaje temporal en la parte inferior de la pantalla (Figura 29)
export function Aviso({ texto, alCerrar }: { texto: string | null; alCerrar: () => void }) {
  useEffect(() => {
    if (!texto) return;
    const temporizador = setTimeout(alCerrar, 3000);
    return () => clearTimeout(temporizador);
  }, [texto, alCerrar]);

  if (!texto) return null;
  return (
    <div role="status" className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 bg-cafe-oscuro px-5 py-3 text-sm text-papel shadow-lg">
      <span className="flex size-6 items-center justify-center bg-naranja text-xs">✓</span>
      {texto}
    </div>
  );
}