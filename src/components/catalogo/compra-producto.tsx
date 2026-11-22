
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCarrito } from "@/components/carrito/proveedor-carrito";
import { Boton } from "@/components/ui/boton";
import { Icono } from "@/components/ui/icono";
import type { Producto } from "@/modules/catalogo-inventario/schema";

export function CompraProducto({
  producto,
}: {
  producto: Producto;
}) {
  const { agregar, sesionActiva } = useCarrito();
  const router = useRouter();

  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    error: boolean;
  } | null>(null);
  const [agregando, setAgregando] = useState(false);

  const agotado = producto.existencias === 0;

  const cambiar = (valor: number) => {
    setCantidad(
      Math.min(Math.max(1, valor), producto.existencias)
    );
  };

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
      const error = await agregar(producto, cantidad);

      setMensaje(
        error
          ? { texto: error, error: true }
          : {
              texto: "Producto agregado al carrito.",
              error: false,
            }
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
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex items-center border border-borde bg-papel">
          <button
            onClick={() => cambiar(cantidad - 1)}
            disabled={agotado || agregando || cantidad <= 1}
            aria-label="Quitar uno"
            className="px-4 py-3 disabled:text-borde"
          >
            <Icono nombre="menos" />
          </button>

          <span className="w-8 text-center text-sm">
            {agotado ? 0 : cantidad}
          </span>

          <button
            onClick={() => cambiar(cantidad + 1)}
            disabled={
              agotado ||
              agregando ||
              cantidad >= producto.existencias
            }
            aria-label="Agregar uno"
            className="px-4 py-3 disabled:text-borde"
          >
            <Icono nombre="mas" />
          </button>
        </div>

        <Boton
          onClick={alAgregar}
          disabled={agotado || agregando}
          className="flex-1"
        >
          {agotado
            ? "Sin existencias"
            : agregando
              ? "Agregando..."
              : "Agregar al carrito"}
        </Boton>
      </div>

      {mensaje && (
        <p
          className={`text-sm ${
            mensaje.error ? "text-red-800" : "text-gris"
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      <Link
        href="/carrito"
        className="flex items-center justify-center gap-2 text-sm text-gris hover:text-naranja"
      >
        Ir al carrito <Icono nombre="flecha" />
      </Link>
    </div>
  );
}
