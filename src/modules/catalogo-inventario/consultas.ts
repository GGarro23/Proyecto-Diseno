import { db } from "@/lib/db";
import type { Categoria, Producto } from "./schema";

type FilaProducto = {
  id_producto: string;
  id_categoria: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  activo: boolean;
  existencias: number;
  imagen_url: string | null;
};

type FilaCategoria = {
  id_categoria: string;
  nombre: string;
};

export async function obtenerProductos(): Promise<Producto[]> {
  const resultado = await db.query<FilaProducto>(`
    SELECT
      id_producto,
      id_categoria,
      codigo,
      nombre,
      descripcion,
      precio,
      activo,
      existencias,
      imagen_url
    FROM producto
    WHERE activo = TRUE
    ORDER BY nombre ASC;
  `);

  return resultado.rows.map((fila) => ({
    idProducto: Number(fila.id_producto),
    idCategoria: Number(fila.id_categoria),
    codigo: fila.codigo,
    nombre: fila.nombre,
    descripcion: fila.descripcion ?? "",
    precio: Number(fila.precio),
    activo: fila.activo,
    existencias: fila.existencias,
    imagenUrl: fila.imagen_url ?? "",
  }));
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  const resultado = await db.query<FilaCategoria>(`
    SELECT id_categoria, nombre
    FROM categoria
    ORDER BY id_categoria;
  `);

  return resultado.rows.map((fila) => ({
    idCategoria: Number(fila.id_categoria),
    nombre: fila.nombre,
  }));
}


type FilaDetalleProducto = FilaProducto & {
  nombre_categoria: string;
};

export async function obtenerProductoPorId(
  idProducto: number
): Promise<{
  producto: Producto;
  categoria: Categoria;
} | null> {
  const resultado = await db.query<FilaDetalleProducto>(
    `
    SELECT
      p.id_producto,
      p.id_categoria,
      p.codigo,
      p.nombre,
      p.descripcion,
      p.precio,
      p.activo,
      p.existencias,
      p.imagen_url,
      c.nombre AS nombre_categoria
    FROM producto p
    INNER JOIN categoria c
      ON p.id_categoria = c.id_categoria
    WHERE p.id_producto = $1
      AND p.activo = TRUE
    LIMIT 1;
    `,
    [idProducto]
  );

  const fila = resultado.rows[0];

  if (!fila) {
    return null;
  }

  return {
    producto: {
      idProducto: Number(fila.id_producto),
      idCategoria: Number(fila.id_categoria),
      codigo: fila.codigo,
      nombre: fila.nombre,
      descripcion: fila.descripcion ?? "",
      precio: Number(fila.precio),
      activo: fila.activo,
      existencias: fila.existencias,
      imagenUrl: fila.imagen_url ?? "",
    },
    categoria: {
      idCategoria: Number(fila.id_categoria),
      nombre: fila.nombre_categoria,
    },
  };
}
