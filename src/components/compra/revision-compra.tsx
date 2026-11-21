
"use client";

import { useState } from "react";

import { useCarrito } from "@/components/carrito/proveedor-carrito";
import { Icono } from "@/components/ui/icono";
import { formatearColones } from "@/lib/formato";

export function RevisionCompra() {
  const {
    lineas,
    cambiarCantidad,
    eliminar,
    cargando,
  } = useCarrito();

  const [errores, setErrores] = useState<
    Record<number, string>
  >({});

  const [procesando, setProcesando] = useState<
    number | null
  >(null);

  const cambiar = async (
    idProducto: number,
    cantidad: number
  ) => {
    if (procesando !== null) return;

    setProcesando(idProducto);

    try {
      const error = await cambiarCantidad(
        { idProducto },
        cantidad
      );

      setErrores((previos) => ({
        ...previos,
        [idProducto]: error ?? "",
      }));
    } catch {
      setErrores((previos) => ({
        ...previos,
        [idProducto]:
          "No fue posible actualizar la cantidad.",
      }));
    } finally {
      setProcesando(null);
    }
  };

  const quitar = async (idProducto: number) => {
    if (procesando !== null) return;

    setProcesando(idProducto);

    try {
      const error = await eliminar(idProducto);

      setErrores((previos) => ({
        ...previos,
        [idProducto]: error ?? "",
      }));
    } catch {
      setErrores((previos) => ({
        ...previos,
        [idProducto]:
          "No fue posible eliminar el producto.",
      }));
    } finally {
      setProcesando(null);
    }
  };

  if (cargando) {
    return (
      <p className="py-8 text-sm text-gris">
        Cargando productos del carrito...
      </p>
    );
  }

  if (lineas.length === 0) {
    return (
      <p className="py-8 text-sm text-gris">
        Tu carrito está vacío.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {lineas.map((linea) => {
        const estaProcesando =
          procesando !== null;

        return (
          <li
            key={linea.idProducto}
            className="flex flex-wrap items-center gap-5 border-b border-borde py-5 first:pt-0"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-naranja">
                Producto N.º {linea.idProducto}
              </span>

              <span className="font-serif text-xl">
                {linea.nombre}
              </span>

              <span className="text-xs text-gris">
                Precio unitario:{" "}
                {formatearColones(
                  Number(linea.precio)
                )}
              </span>

              <button
                type="button"
                onClick={() =>
                  void quitar(linea.idProducto)
                }
                disabled={estaProcesando}
                className="self-start text-xs text-red-800 hover:underline disabled:opacity-50"
              >
                {procesando === linea.idProducto
                  ? "Procesando..."
                  : "Eliminar"}
              </button>

              {errores[linea.idProducto] && (
                <span
                  role="alert"
                  className="text-xs text-red-800"
                >
                  {errores[linea.idProducto]}
                </span>
              )}
            </div>

            <div className="flex items-center border border-borde">
              <button
                type="button"
                onClick={() =>
                  void cambiar(
                    linea.idProducto,
                    linea.cantidad - 1
                  )
                }
                disabled={
                  estaProcesando ||
                  linea.cantidad <= 1
                }
                aria-label={`Quitar una unidad de ${linea.nombre}`}
                className="px-3 py-2 disabled:text-borde"
              >
                <Icono nombre="menos" />
              </button>

              <span className="w-8 text-center text-sm">
                {linea.cantidad}
              </span>

              <button
                type="button"
                onClick={() =>
                  void cambiar(
                    linea.idProducto,
                    linea.cantidad + 1
                  )
                }
                disabled={estaProcesando}
                aria-label={`Agregar una unidad de ${linea.nombre}`}
                className="px-3 py-2 disabled:text-borde"
              >
                <Icono nombre="mas" />
              </button>
            </div>

            <span className="w-28 text-right font-serif text-xl">
              {formatearColones(
                Number(linea.precio) *
                  linea.cantidad
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
