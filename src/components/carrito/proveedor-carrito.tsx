
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useSesion } from "@/components/sesion/proveedor-sesion";
import type { Producto } from "@/modules/catalogo-inventario/schema";
import type { LineaCarrito } from "@/modules/ventas-pagos/schema";

import {
  apiConsultarCarrito,
  apiAgregarCarrito,
  apiActualizarCarrito,
  apiEliminarCarrito,
} from "@/lib/api-ventas";

type Linea = Omit<LineaCarrito, "idCarrito"> & {
  nombre: string;
  precio: number;
};

type ContextoCarrito = {
  lineas: Linea[];
  cantidadTotal: number;
  sesionActiva: boolean;
  cargando: boolean;
  agregar: (
    producto: Producto,
    cantidad: number
  ) => Promise<string | null>;
  cambiarCantidad: (
  producto: Pick<Producto, "idProducto">,
  cantidad: number
) => Promise<string | null>;
  eliminar: (idProducto: number) => Promise<string | null>;
  vaciar: () => void;
  refrescar: () => Promise<void>;
};

const Contexto = createContext<ContextoCarrito | null>(null);

export function ProveedorCarrito({
  children,
}: {
  children: ReactNode;
}) {
  const { sesion, cargando: cargandoSesion } = useSesion();

  const idUsuario = sesion?.usuario.idUsuario ?? null;
  const sesionActiva = idUsuario !== null;

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [cargando, setCargando] = useState(true);

  // Evita aplicar resultados de una sesión anterior.
  const sesionActual = useRef(idUsuario);

useEffect(() => {
  sesionActual.current = idUsuario;
}, [idUsuario]);

  const cargarCarrito = useCallback(async (
    usuarioEsperado: number
  ) => {
    const resultado = await apiConsultarCarrito();

    if (sesionActual.current !== usuarioEsperado) {
      return;
    }

    if (!resultado.ok) {
      throw new Error(resultado.error);
    }

    setLineas(
  resultado.dato.productos.map((producto) => ({
    idProducto: producto.idProducto,
    nombre: producto.nombre,
    precio: Number(producto.precio),
    cantidad: producto.cantidad,
  }))
);
  }, []);


useEffect(() => {
  if (cargandoSesion) return;

  let cancelado = false;

  async function sincronizarCarrito() {
    // Ejecutar la sincronización de forma asíncrona.
    await Promise.resolve();

    if (cancelado) return;

    if (idUsuario === null) {
      setLineas([]);
      setCargando(false);
      return;
    }

    setLineas([]);
    setCargando(true);

    try {
      await cargarCarrito(idUsuario);
    } catch (error) {
      if (!cancelado) {
        console.error(
          "Error al cargar el carrito:",
          error
        );
      }
    } finally {
      if (!cancelado) {
        setCargando(false);
      }
    }
  }

  void sincronizarCarrito();

  return () => {
    cancelado = true;
  };
}, [idUsuario, cargandoSesion, cargarCarrito]);


  const refrescar = useCallback(async () => {
    if (idUsuario === null) {
      setLineas([]);
      return;
    }

    await cargarCarrito(idUsuario);
  }, [idUsuario, cargarCarrito]);

  const agregar = async (
    producto: Producto,
    cantidad: number
  ): Promise<string | null> => {
    if (!sesionActiva) {
      return "Inicia sesión para agregar productos.";
    }

    if (!producto.activo) {
      return "Este producto no está disponible.";
    }

    if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
      return "La cantidad debe ser un entero positivo.";
    }

    const resultado = await apiAgregarCarrito(
      producto.idProducto,
      cantidad
    );

    if (!resultado.ok) return resultado.error;

    try {
      await refrescar();
      return null;
    } catch {
      return "Producto guardado, pero no se pudo actualizar el carrito.";
    }
  };

const cambiarCantidad = async (
  producto: Pick<Producto, "idProducto">,
  cantidad: number
): Promise<string | null> => {
    if (!sesionActiva) {
      return "Inicia sesión para modificar el carrito.";
    }

    if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
      return "La cantidad debe ser un entero positivo.";
    }

    const resultado = await apiActualizarCarrito(
      producto.idProducto,
      cantidad
    );

    if (!resultado.ok) return resultado.error;

    try {
      await refrescar();
      return null;
    } catch {
      return "Cantidad guardada, pero no se pudo actualizar el carrito.";
    }
  };

  const eliminar = async (
    idProducto: number
  ): Promise<string | null> => {
    if (!sesionActiva) {
      return "Inicia sesión para modificar el carrito.";
    }

    const resultado = await apiEliminarCarrito(idProducto);

    if (!resultado.ok) return resultado.error;

    try {
      await refrescar();
      return null;
    } catch {
      return "Producto eliminado, pero no se pudo actualizar el carrito.";
    }
  };

  // Solo limpia la visualización local.
  // El vaciado persistente debe implementarse en el backend.
  const vaciar = () => {
    setLineas([]);
  };

  const cantidadTotal = lineas.reduce(
    (suma, linea) => suma + linea.cantidad,
    0
  );

  return (
    <Contexto.Provider
      value={{
        lineas,
        cantidadTotal,
        sesionActiva,
        cargando: cargando || cargandoSesion,
        agregar,
        cambiarCantidad,
        eliminar,
        vaciar,
        refrescar,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useCarrito() {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error(
      "useCarrito debe usarse dentro de ProveedorCarrito"
    );
  }

  return contexto;
}
