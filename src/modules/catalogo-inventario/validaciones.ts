import { cambioEnExistencias } from "./reglas";
import type { Categoria, Producto, TipoMovimiento } from "./schema";

const mismoTexto = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function validarCategoria(nombre: string, categorias: Categoria[], idCategoria?: number): string | undefined {
  if (!nombre.trim()) return "Indica el nombre de la categoría.";
  if (categorias.some((c) => c.idCategoria !== idCategoria && mismoTexto(c.nombre, nombre))) {
    return "Ya existe una categoría con ese nombre.";
  }
}

export type DatosProducto = {
  codigo: string;
  nombre: string;
  idCategoria: string;
  precio: string;
  descripcion: string;
  imagenUrl: string;
};

export type ErroresProducto = Partial<Record<keyof DatosProducto, string>>;

export function validarProducto(
  datos: DatosProducto,
  productos: Producto[],
  categorias: Categoria[],
  idProducto?: number
): ErroresProducto {
  const errores: ErroresProducto = {};
  if (!datos.codigo.trim()) errores.codigo = "Indica el código del producto.";
  else if (productos.some((p) => p.idProducto !== idProducto && mismoTexto(p.codigo, datos.codigo))) {
    errores.codigo = "Ya existe un producto con ese código.";
  }
  if (!datos.nombre.trim()) errores.nombre = "Indica el nombre del producto.";
  if (!categorias.some((c) => String(c.idCategoria) === datos.idCategoria)) errores.idCategoria = "Selecciona una categoría existente.";
  const precio = Number(datos.precio);
  if (!datos.precio.trim() || !Number.isFinite(precio) || precio <= 0) errores.precio = "Indica un precio mayor que cero.";
  if (!datos.descripcion.trim()) errores.descripcion = "Indica la descripción del producto.";
  return errores;
}

export function validarCantidad(cantidad: string): string | undefined {
  const n = Number(cantidad);
  if (!cantidad.trim() || !Number.isInteger(n) || n <= 0) return "Indica una cantidad entera mayor que cero.";
}

export function validarAjuste(
  existencias: number,
  tipo: Extract<TipoMovimiento, "Ajuste positivo" | "Ajuste negativo">,
  cantidad: string,
  motivo: string
): { cantidad?: string; motivo?: string } {
  const errores: { cantidad?: string; motivo?: string } = {};
  const errorCantidad = validarCantidad(cantidad);
  if (errorCantidad) errores.cantidad = errorCantidad;
  else if (existencias + cambioEnExistencias(tipo, Number(cantidad)) < 0) {
    errores.cantidad = `La disminución no puede ser mayor que las existencias actuales (${existencias}).`;
  }
  if (!motivo.trim()) errores.motivo = "Indica el motivo del ajuste.";
  return errores;
}