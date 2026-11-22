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

type ResultadoInventario =
  | { ok: true; dato: EstadoInventario }
  | { ok: false; error: string };

async function pedirInventario(): Promise<ResultadoInventario> {
  try {
    const respuesta = await fetch("/api/inventario", {
      cache: "no-store",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.ok) {
      return {
        ok: false,
        error:
          resultado.error ??
          "No se pudo consultar el inventario.",
      };
    }

    return { ok: true, dato: resultado.dato };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Error inesperado al cargar inventario.",
    };
  }
}

export function useInventario() {
  const [inventario, setInventario] =
    useState<EstadoInventario>(ESTADO_INICIAL);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aplicar = useCallback((resultado: ResultadoInventario) => {
    if (resultado.ok) {
      setInventario(resultado.dato);
      setError(null);
    } else {
      setError(resultado.error);
    }

    setCargando(false);
  }, []);

  const recargar = useCallback(async () => {
    setCargando(true);
    aplicar(await pedirInventario());
  }, [aplicar]);

  useEffect(() => {
    let vigente = true;

    pedirInventario().then((resultado) => {
      if (vigente) aplicar(resultado);
    });

    return () => {
      vigente = false;
    };
  }, [aplicar]);

  return {
    ...inventario,
    cargando,
    error,
    recargar,
  };
}
