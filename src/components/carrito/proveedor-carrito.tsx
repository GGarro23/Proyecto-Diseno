"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { Producto } from "@/modules/catalogo-inventario/schema";
import type { LineaCarrito } from "@/modules/ventas-pagos/schema";

// Carrito temporal en el navegador mientras no exista la API (HU-06, RF-20 a RF-22).
type Linea = Omit<LineaCarrito, "idCarrito">;

const CLAVE = "intervallum-carrito";
const oyentes = new Set<() => void>();
let memoria = "[]"; // respaldo si el navegador no permite localStorage

function leer() {
  try {
    return localStorage.getItem(CLAVE) ?? memoria;
  } catch {
    return memoria;
  }
}

function escribir(lineas: Linea[]) {
  memoria = JSON.stringify(lineas);
  try {
    localStorage.setItem(CLAVE, memoria);
  } catch {}
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("storage", avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

type ContextoCarrito = {
  lineas: Linea[];
  cantidadTotal: number;
  sesionActiva: boolean;
  agregar: (producto: Producto, cantidad: number) => string | null;
  cambiarCantidad: (producto: Producto, cantidad: number) => string | null;
  eliminar: (idProducto: number) => void;
  vaciar: () => void;
};

const Contexto = createContext<ContextoCarrito | null>(null);

export function ProveedorCarrito({ sesionActiva, children }: { sesionActiva: boolean; children: ReactNode }) {
  const crudo = useSyncExternalStore(suscribir, leer, () => "[]");
  const lineas = useMemo(() => JSON.parse(crudo) as Linea[], [crudo]);

  // Devuelve un mensaje de error o null si se agregó (HU-06, criterios 6 y 7)
  const agregar = (producto: Producto, cantidad: number) => {
    if (!sesionActiva) return "Inicia sesión para agregar productos al carrito.";
    if (!producto.activo) return "Este producto no está disponible.";
    if (!Number.isInteger(cantidad) || cantidad <= 0) return "La cantidad debe ser un número entero positivo.";

    const actual = lineas.find((l) => l.idProducto === producto.idProducto)?.cantidad ?? 0;
    if (actual + cantidad > producto.existencias) {
      return `Solo hay ${producto.existencias} unidades disponibles.`;
    }

    escribir(
      actual
        ? lineas.map((l) => (l.idProducto === producto.idProducto ? { ...l, cantidad: actual + cantidad } : l))
        : [...lineas, { idProducto: producto.idProducto, cantidad }]
    );
    return null;
  };

    // Modificar la cantidad de una línea existente (RF-21)
  const cambiarCantidad = (producto: Producto, cantidad: number) => {
    if (!Number.isInteger(cantidad) || cantidad <= 0) return "La cantidad debe ser un número entero positivo.";
    if (cantidad > producto.existencias) return `Solo hay ${producto.existencias} unidades disponibles.`;
    escribir(lineas.map((l) => (l.idProducto === producto.idProducto ? { ...l, cantidad } : l)));
    return null;
  };

  // Retirar una línea del carrito (RF-22)
  const eliminar = (idProducto: number) => escribir(lineas.filter((l) => l.idProducto !== idProducto));

  const vaciar = () => escribir([]);


  const cantidadTotal = lineas.reduce((suma, l) => suma + l.cantidad, 0);

  return (
    <Contexto.Provider value={{ lineas, cantidadTotal, sesionActiva, agregar, cambiarCantidad, eliminar, vaciar }}>
      {children}
    </Contexto.Provider>
  );
}

export function useCarrito() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useCarrito debe usarse dentro de ProveedorCarrito");
  return contexto;
}