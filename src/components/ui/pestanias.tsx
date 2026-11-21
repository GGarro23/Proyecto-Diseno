"use client";

// Pestañas (Figuras 25 y 26)
export function Pestanias({ opciones, activa, alCambiar }: { opciones: string[]; activa: string; alCambiar: (opcion: string) => void }) {
  return (
    <div role="tablist" className="flex gap-2 border-b border-borde">
      {opciones.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={o === activa}
          onClick={() => alCambiar(o)}
          className={`-mb-px border-b-2 px-5 py-3 text-sm ${
            o === activa ? "border-naranja font-medium text-tinta" : "border-transparent text-gris hover:text-tinta"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}