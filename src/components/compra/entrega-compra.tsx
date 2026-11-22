
"use client";

import {
  AreaTexto,
  Campo,
  Selector,
} from "@/components/ui/campo";

import { PROVINCIAS } from "@/lib/provincias";

import type {
  ModalidadEntrega,
} from "@/modules/ventas-pagos/schema";

export type DatosEntrega = {
  modalidad: ModalidadEntrega | null;
  provincia: string;
  canton: string;
  direccion: string;
};

const OPCIONES: {
  modalidad: ModalidadEntrega;
  detalle: string;
}[] = [
  {
    modalidad: "Retiro presencial",
    detalle: "Retiro en tienda · Sin costo adicional",
  },
  {
    modalidad: "Envío a domicilio",
    detalle: "Entrega a domicilio · Sin costo adicional",
  },
];

type Props = {
  datos: DatosEntrega;
  errores: Partial<
    Record<keyof DatosEntrega, string>
  >;
  alCambiar: (datos: DatosEntrega) => void;
};

export function EntregaCompra({
  datos,
  errores,
  alCambiar,
}: Props) {
  const cambiar = (
    campo: keyof DatosEntrega,
    valor: string
  ) => {
    alCambiar({
      ...datos,
      [campo]: valor,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {OPCIONES.map((opcion) => {
        const elegida =
          datos.modalidad === opcion.modalidad;

        return (
          <button
            key={opcion.modalidad}
            type="button"
            onClick={() =>
              alCambiar({
                ...datos,
                modalidad: opcion.modalidad,
              })
            }
            className={`flex items-center justify-between border p-5 text-left ${
              elegida
                ? "border-naranja bg-naranja-claro"
                : "border-borde bg-papel hover:border-cafe"
            }`}
          >
            <span className="flex flex-col gap-1">
              <span className="font-medium">
                {opcion.modalidad}
              </span>

              <span className="text-sm text-gris">
                {opcion.detalle}
              </span>
            </span>

            <span
              className={`flex size-6 items-center justify-center rounded-full border text-xs ${
                elegida
                  ? "border-naranja bg-naranja text-papel"
                  : "border-borde"
              }`}
            >
              {elegida && "✓"}
            </span>
          </button>
        );
      })}

      {errores.modalidad && (
        <p className="text-sm text-red-800">
          {errores.modalidad}
        </p>
      )}

      {datos.modalidad === "Envío a domicilio" && (
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <Selector
            etiqueta="Provincia"
            value={datos.provincia}
            onChange={(evento) =>
              cambiar(
                "provincia",
                evento.target.value
              )
            }
          >
            {PROVINCIAS.map((provincia) => (
              <option key={provincia}>
                {provincia}
              </option>
            ))}
          </Selector>

          <Campo
            etiqueta="Cantón"
            value={datos.canton}
            error={errores.canton}
            onChange={(evento) =>
              cambiar(
                "canton",
                evento.target.value
              )
            }
          />

          <div className="sm:col-span-2">
            <AreaTexto
              etiqueta="Dirección exacta"
              value={datos.direccion}
              error={errores.direccion}
              onChange={(evento) =>
                cambiar(
                  "direccion",
                  evento.target.value
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
