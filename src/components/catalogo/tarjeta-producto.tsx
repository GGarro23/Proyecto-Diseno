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
          <span className="absolute left-4 top-4 rounded-full bg-papel px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Agotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-naranja">{categoria?.nombre}</p>
        <h3 className="font-serif text-2xl">{producto.nombre}</h3>
        <p className="line-clamp-2 text-sm text-gris">{producto.descripcion}</p>
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-xl">{formatearColones(producto.precio)}</span>
          <span className={`text-xs ${agotado ? "text-red-800" : "text-gris"}`}>
            {agotado ? "Sin existencias" : `${producto.existencias} disponibles`}
          </span>
        </div>
        <AccionesProducto producto={producto} />
      </div>
    </article>
  );
}