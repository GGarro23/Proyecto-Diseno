
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icono } from "@/components/ui/icono";
import type { Producto } from "@/modules/catalogo-inventario/schema";
import { useCarrito } from "./proveedor-carrito";

// Botones de la tarjeta de producto.
export function AccionesProducto({
  producto,
}: {
  producto: Producto;
}) {
  const { agregar, sesionActiva } = useCarrito();
  const router = useRouter();

  const [mensaje, setMensaje] = useState<{
    texto: string;
    error: boolean;
  } | null>(null);

  const [agregando, setAgregando] = useState(false);

  const agotado = producto.existencias === 0;

  const alAgregar = async () => {
    if (!sesionActiva) {
      router.push(
        `/iniciar-sesion?volver=/catalogo/${producto.idProducto}`
      );
      return;
    }

    if (agregando) return;

    setAgregando(true);
    setMensaje(null);

    try {
      const error = await agregar(producto, 1);

      setMensaje(
        error
          ? { texto: error, error: true }
          : { texto: "Agregado al carrito.", error: false }
      );
    } catch {
      setMensaje({
        texto: "No se pudo agregar el producto al carrito.",
        error: true,
      });
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div className="mt-auto flex flex-col gap-2">
      <div className="flex gap-2">
        <Link
          href={`/catalogo/${producto.idProducto}`}
          className="flex-1 border border-borde py-3 text-center text-sm font-medium hover:border-cafe"
        >
          Ver producto
        </Link>

        <button
          onClick={alAgregar}
          disabled={agotado || agregando}
          aria-label="Agregar al carrito"
          className="bg-naranja px-4 text-papel hover:bg-naranja-oscuro disabled:bg-borde"
        >
          <Icono nombre="bolsa" />
        </button>
      </div>

      {mensaje && (
        <p
          className={`text-xs ${
            mensaje.error ? "text-red-800" : "text-gris"
          }`}
        >
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}
