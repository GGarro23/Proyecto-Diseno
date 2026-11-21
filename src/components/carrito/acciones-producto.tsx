"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icono } from "@/components/ui/icono";
import type { Producto } from "@/modules/catalogo-inventario/schema";
import { useCarrito } from "./proveedor-carrito";

// Botones de la tarjeta de producto: "Ver producto" y agregar 1 unidad al carrito
export function AccionesProducto({ producto }: { producto: Producto }) {
  const { agregar, sesionActiva } = useCarrito();
  const router = useRouter();
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);
  const agotado = producto.existencias === 0;

  const alAgregar = () => {
    if (!sesionActiva) return router.push("/iniciar-sesion");
    const error = agregar(producto, 1);
    setMensaje(error ? { texto: error, error: true } : { texto: "Agregado al carrito.", error: false });
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
          disabled={agotado}
          aria-label="Agregar al carrito"
          className="bg-naranja px-4 text-papel hover:bg-naranja-oscuro disabled:bg-borde"
        >
          <Icono nombre="bolsa" />
        </button>
      </div>
      {mensaje && (
        <p className={`text-xs ${mensaje.error ? "text-red-800" : "text-gris"}`}>{mensaje.texto}</p>
      )}
    </div>
  );
}