import { AccionesProducto } from "@/components/carrito/acciones-producto";
import { Foto } from "@/components/ui/foto";
import { formatearColones } from "@/lib/formato";
import type { Categoria, Producto } from "@/modules/catalogo-inventario/schema";

type Props = { producto: Producto; categoria?: Categoria; className?: string };

export function TarjetaProducto({ producto, categoria, className = "" }: Props) {
  const agotado = producto.existencias === 0;

  return (
    <article className={`flex flex-col border border-borde bg-papel ${className}`}>
      <div className="relative">
        <Foto src={producto.imagenUrl} alt={producto.nombre} className="h-52" />
        {agotado && (
          <span className="absolute left-4 top-4 rounded-full bg-naranja px-3 py-1 text-xs font-semibold uppercase tracking-wider text-papel">
            Agotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-naranja">{categoria?.nombre}</p>
        <h3 className="font-serif text-2xl">{producto.nombre}</h3>
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-4">
          <span className="text-2xl font-bold tabular-nums text-naranja">{formatearColones(producto.precio)}</span>
          <span className={`text-xs ${agotado ? "text-red-800" : "text-gris"}`}>
            {agotado ? "Sin existencias" : `${producto.existencias} disponibles`}
          </span>
        </div>
        <AccionesProducto producto={producto} />
      </div>
    </article>
  );
}