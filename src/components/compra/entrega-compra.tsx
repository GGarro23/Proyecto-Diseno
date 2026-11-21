"use client";

import { AreaTexto, Campo, Selector } from "@/components/ui/campo";
import { formatearColones } from "@/lib/formato";
import { PROVINCIAS } from "@/lib/provincias";
import { COSTO_ENTREGA } from "@/mocks/compra";
import type { ModalidadEntrega } from "@/modules/ventas-pagos/schema";

export type DatosEntrega = {
  modalidad: ModalidadEntrega | null;
  provincia: string;
  canton: string;
  direccion: string;
};

const OPCIONES: { modalidad: ModalidadEntrega; detalle: string }[] = [
  { modalidad: "Retiro presencial", detalle: "San Pedro · Sin costo" },
  { modalidad: "Envío a domicilio", detalle: `2–4 días hábiles · ${formatearColones(COSTO_ENTREGA["Envío a domicilio"])}` },
];

type Props = {
  datos: DatosEntrega;
  errores: Partial<Record<keyof DatosEntrega, string>>;
  alCambiar: (datos: DatosEntrega) => void;
};

// Paso 2: modalidad de entrega (Figura 14, RF-24)
export function EntregaCompra({ datos, errores, alCambiar }: Props) {
  const cambiar = (campo: keyof DatosEntrega, valor: string) => alCambiar({ ...datos, [campo]: valor });

  return (
    <div className="flex flex-col gap-4">
      {OPCIONES.map((o) => {
        const elegida = datos.modalidad === o.modalidad;
        return (
          <button
            key={o.modalidad}
            onClick={() => alCambiar({ ...datos, modalidad: o.modalidad })}
            className={`flex items-center justify-between border p-5 text-left ${
              elegida ? "border-naranja bg-naranja-claro" : "border-borde bg-papel hover:border-cafe"
            }`}
          >
            <span className="flex flex-col gap-1">
              <span className="font-medium">{o.modalidad}</span>
              <span className="text-sm text-gris">{o.detalle}</span>
            </span>
            <span
              className={`flex size-6 items-center justify-center rounded-full border text-xs ${
                elegida ? "border-naranja bg-naranja text-papel" : "border-borde"
              }`}
            >
              {elegida && "✓"}
            </span>
          </button>
        );
      })}
      {errores.modalidad && <p className="text-sm text-red-800">{errores.modalidad}</p>}

      {datos.modalidad === "Envío a domicilio" && (
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <Selector etiqueta="Provincia" value={datos.provincia} onChange={(e) => cambiar("provincia", e.target.value)}>
            {PROVINCIAS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Selector>
          <Campo etiqueta="Cantón" value={datos.canton} error={errores.canton} onChange={(e) => cambiar("canton", e.target.value)} />
          <div className="sm:col-span-2">
            <AreaTexto
              etiqueta="Dirección exacta"
              value={datos.direccion}
              error={errores.direccion}
              onChange={(e) => cambiar("direccion", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}