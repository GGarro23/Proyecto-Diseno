import type { ReactNode } from "react";
import { formatearColones } from "@/lib/formato";
import { buscarProducto } from "@/mocks/compra-simulada";

type Props = {
  lineas: { idProducto: number; cantidad: number }[];
  costoEntrega: number | null; // null mientras no se elija la modalidad
  children: ReactNode;
};

// Tarjeta "Resumen" de las Figuras 13–15
export function ResumenCompra({ lineas, costoEntrega, children }: Props) {
  const subtotal = lineas.reduce(
    (suma, l) => suma + (buscarProducto(l.idProducto)?.precio ?? 0) * l.cantidad,
    0
  );

  return (
    <aside className="flex flex-col gap-5 border border-borde bg-papel p-7">
      <h2 className="font-serif text-2xl">Resumen</h2>
      <ul className="flex flex-col gap-2 border-b border-borde pb-5 text-sm">
        {lineas.map((l) => {
          const producto = buscarProducto(l.idProducto);
          return (
            <li key={l.idProducto} className="flex justify-between gap-4 text-gris">
              <span>{l.cantidad} × {producto?.nombre}</span>
              <span className="text-tinta">{formatearColones((producto?.precio ?? 0) * l.cantidad)}</span>
            </li>
          );
        })}
      </ul>
      <dl className="flex flex-col gap-1 border-b border-borde pb-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-gris">Subtotal</dt>
          <dd>{formatearColones(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gris">Entrega</dt>
          <dd>
            {costoEntrega === null
              ? "Se elige en el paso 2"
              : costoEntrega === 0
                ? "Sin costo"
                : formatearColones(costoEntrega)}
          </dd>
        </div>
      </dl>
      <div className="flex items-baseline justify-between">
        <span>Total</span>
        <span className="font-serif text-3xl">{formatearColones(subtotal + (costoEntrega ?? 0))}</span>
      </div>
      {children}
    </aside>
  );
}