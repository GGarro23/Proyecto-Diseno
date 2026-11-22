"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  Categoria,
  Producto,
  MovimientoInventario,
} from "@/modules/catalogo-inventario/schema";

type EstadoInventario = {
  productos: Producto[];
  categorias: Categoria[];
  movimientos: MovimientoInventario[];
};

const ESTADO_INICIAL: EstadoInventario = {
  productos: [],
  categorias: [],
  movimientos: [],
};

// Hook conectado a la API real de PostgreSQL.
export function useInventario() {
  const [inventario, setInventario] =
    useState<EstadoInventario>(ESTADO_INICIAL);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);

    try {
      const respuesta = await fetch("/api/inventario", {
        cache: "no-store",
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        throw new Error(
          resultado.error ??
            "No se pudo consultar el inventario."
        );
      }

      setInventario(resultado.dato);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Error inesperado al cargar inventario."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return {
    ...inventario,
    cargando,
    error,
    recargar,
  };
}
