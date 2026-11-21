import { FlujoCompra } from "@/components/compra/flujo";
import { sesion } from "@/mocks/sesion";

// Carrito y compra (Figuras 13–16, CU-09)
export default function Carrito() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <FlujoCompra sesion={sesion} />
    </div>
  );
}