import type { ReactNode } from "react";
import { Sobretitulo } from "@/components/ui/textos";

// Marco común de las pantallas de acceso y registro
export function MarcoCuenta({ titulo, destacado, children }: { titulo: string; destacado: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <div className="mb-8 text-center">
        <Sobretitulo>Cuenta Intervallum</Sobretitulo>
        <h1 className="mt-3 font-serif text-4xl">
          {titulo} <em className="text-naranja">{destacado}</em>
        </h1>
      </div>
      <div className="border border-borde bg-papel p-8">{children}</div>
    </div>
  );
}