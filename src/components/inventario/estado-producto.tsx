import { estadoExistencias } from "@/modules/catalogo-inventario/reglas";
import type { Producto } from "@/modules/catalogo-inventario/schema";

const COLORES = {
  Disponible: "border-borde text-cafe",
  "Existencias bajas": "border-naranja/40 bg-naranja-claro text-naranja-oscuro",
  Agotado: "border-naranja bg-naranja text-papel",
  Inactivo: "border-borde bg-crema text-gris",
};

// Estado del producto en el inventario (Figura 34)
export function EstadoProducto({ producto }: { producto: Producto }) {
  const estado = estadoExistencias(producto);
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${COLORES[estado]}`}>
      {estado}
    </span>
  );
}