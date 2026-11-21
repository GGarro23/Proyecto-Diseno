"use client";

import { Campo } from "@/components/ui/campo";

// Paso 3: pago simulado (Figura 15, RF-25)
export function PagoCompra({ codigo, error, alCambiar }: { codigo: string; error?: string; alCambiar: (codigo: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-l-2 border-naranja bg-naranja-claro px-5 py-4">
        <p className="font-medium">Entorno de demostración</p>
        <p className="mt-1 text-sm text-gris">No se procesará ningún cargo real. Usa APROBADO o RECHAZADO.</p>
      </div>
      <Campo
        etiqueta="Código de resultado"
        value={codigo}
        error={error}
        onChange={(e) => alCambiar(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}