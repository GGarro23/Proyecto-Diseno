import { cambioEnExistencias } from "@/modules/catalogo-inventario/reglas";
import type { Categoria, MovimientoInventario, Producto } from "@/modules/catalogo-inventario/schema";
import {
  validarAjuste,
  validarCantidad,
  validarCategoria,
  validarProducto,
  type DatosProducto,
  type ErroresProducto,
} from "@/modules/catalogo-inventario/validaciones";
import { categorias as categoriasIniciales } from "./categorias";
import { productos as productosIniciales } from "./productos";

// Simula lo que hará la API de catálogo e inventario mientras no exista backend (RF-11 a RF-19).
// Por ahora solo lo usan las pantallas de administración; el resto del sitio lee mocks/productos.ts.

type Resultado<T> = { ok: true; dato: T } | { ok: false; error: string };
type Inventario = { productos: Producto[]; categorias: Categoria[]; movimientos: MovimientoInventario[] };

const CLAVE_PRODUCTOS = "intervallum-productos";
const CLAVE_CATEGORIAS = "intervallum-categorias";
const CLAVE_MOVIMIENTOS = "intervallum-movimientos";
const oyentes = new Set<() => void>();

// Movimientos de prueba que explican las existencias de mocks/productos.ts (Figura 39)
function movimiento(
  idMovimiento: number,
  idProducto: number,
  tipo: MovimientoInventario["tipo"],
  cantidad: number,
  motivo: string,
  dia: number
): MovimientoInventario {
  return {
    idMovimiento,
    idProducto,
    tipo,
    cantidad,
    motivo,
    fecha: `2026-11-${String(dia).padStart(2, "0")}T14:00:00.000Z`,
    idResponsable: 30,
    idPedido: null,
    idEjecucion: null,
  };
}

function movimientosPrevios(): MovimientoInventario[] {
  return [
    movimiento(1, 1, "Entrada", 2, "Entrada manual de inventario", 1),
    movimiento(2, 2, "Entrada", 7, "Entrada manual de inventario", 1),
    movimiento(3, 3, "Entrada", 12, "Entrada manual de inventario", 1),
    movimiento(4, 4, "Entrada", 1, "Entrada manual de inventario", 1),
    movimiento(5, 1, "Entrada", 2, "Entrada manual de inventario", 5),
    movimiento(6, 4, "Ajuste negativo", 1, "Producto de exhibición", 6),
  ];
}

function avisar() {
  oyentes.forEach((f) => f());
}

export function suscribirInventario(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

// Para useSyncExternalStore: texto con productos, categorías y movimientos guardados
export function leerEstadoInventario(): string {
  try {
    return JSON.stringify([
      localStorage.getItem(CLAVE_PRODUCTOS),
      localStorage.getItem(CLAVE_CATEGORIAS),
      localStorage.getItem(CLAVE_MOVIMIENTOS),
    ]);
  } catch {
    return "[null,null,null]";
  }
}

// Convierte ese texto en el inventario
export function inventarioDesde(estado: string): Inventario {
  const [productos, categorias, movimientos] = JSON.parse(estado) as (string | null)[];
  return {
    productos: productos ? JSON.parse(productos) : productosIniciales,
    categorias: categorias ? JSON.parse(categorias) : categoriasIniciales,
    movimientos: movimientos ? JSON.parse(movimientos) : movimientosPrevios(),
  };
}

function leerInventario(): Inventario {
  return inventarioDesde(leerEstadoInventario());
}

function guardar(cambios: Partial<Inventario>) {
  try {
    if (cambios.productos) localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(cambios.productos));
    if (cambios.categorias) localStorage.setItem(CLAVE_CATEGORIAS, JSON.stringify(cambios.categorias));
    if (cambios.movimientos) localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(cambios.movimientos));
  } catch {}
  avisar();
}

const siguienteId = (ids: number[]) => Math.max(0, ...ids) + 1;

// RF-11
export function registrarCategoria(nombre: string): Resultado<Categoria> {
  const { categorias } = leerInventario();
  const error = validarCategoria(nombre, categorias);
  if (error) return { ok: false, error };
  const categoria: Categoria = { idCategoria: siguienteId(categorias.map((c) => c.idCategoria)), nombre: nombre.trim() };
  guardar({ categorias: [...categorias, categoria] });
  return { ok: true, dato: categoria };
}

// RF-12: los productos siguen apuntando al mismo idCategoria
export function modificarCategoria(idCategoria: number, nombre: string): Resultado<Categoria> {
  const { categorias } = leerInventario();
  const categoria = categorias.find((c) => c.idCategoria === idCategoria);
  if (!categoria) return { ok: false, error: "La categoría no existe." };
  const error = validarCategoria(nombre, categorias, idCategoria);
  if (error) return { ok: false, error };
  categoria.nombre = nombre.trim();
  guardar({ categorias });
  return { ok: true, dato: categoria };
}

type ResultadoProducto = { ok: true; dato: Producto } | { ok: false; errores: ErroresProducto; error?: string };

function datosLimpios(datos: DatosProducto) {
  return {
    codigo: datos.codigo.trim(),
    nombre: datos.nombre.trim(),
    idCategoria: Number(datos.idCategoria),
    precio: Number(datos.precio),
    descripcion: datos.descripcion.trim(),
    imagenUrl: datos.imagenUrl.trim(),
  };
}

// RF-13: el producto nace activo y sin existencias; las unidades entran con RF-18
export function registrarProducto(datos: DatosProducto): ResultadoProducto {
  const { productos, categorias } = leerInventario();
  const errores = validarProducto(datos, productos, categorias);
  if (Object.keys(errores).length > 0) return { ok: false, errores };
  const producto: Producto = {
    idProducto: siguienteId(productos.map((p) => p.idProducto)),
    ...datosLimpios(datos),
    activo: true,
    existencias: 0,
  };
  guardar({ productos: [...productos, producto] });
  return { ok: true, dato: producto };
}

// RF-14: cambia solo los datos descriptivos; existencias y movimientos no se tocan
export function modificarProducto(idProducto: number, datos: DatosProducto): ResultadoProducto {
  const { productos, categorias } = leerInventario();
  const producto = productos.find((p) => p.idProducto === idProducto);
  if (!producto) return { ok: false, errores: {}, error: "El producto no existe." };
  const errores = validarProducto(datos, productos, categorias, idProducto);
  if (Object.keys(errores).length > 0) return { ok: false, errores };
  Object.assign(producto, datosLimpios(datos));
  guardar({ productos });
  return { ok: true, dato: producto };
}

// RF-15: se marca como inactivo; sus movimientos y pedidos se conservan
export function desactivarProducto(idProducto: number): Resultado<Producto> {
  const { productos } = leerInventario();
  const producto = productos.find((p) => p.idProducto === idProducto);
  if (!producto) return { ok: false, error: "El producto no existe." };
  if (!producto.activo) return { ok: false, error: "El producto ya está desactivado." };
  producto.activo = false;
  guardar({ productos });
  return { ok: true, dato: producto };
}

// Guarda el movimiento y el nuevo saldo juntos. En el backend esto es una sola transacción.
function aplicarMovimiento(
  inventario: Inventario,
  producto: Producto,
  datos: Pick<MovimientoInventario, "tipo" | "cantidad" | "motivo" | "idResponsable">
): MovimientoInventario {
  const nuevo: MovimientoInventario = {
    idMovimiento: siguienteId(inventario.movimientos.map((m) => m.idMovimiento)),
    idProducto: producto.idProducto,
    fecha: new Date().toISOString(),
    idPedido: null,
    idEjecucion: null,
    ...datos,
  };
  producto.existencias += cambioEnExistencias(nuevo.tipo, nuevo.cantidad);
  guardar({ productos: inventario.productos, movimientos: [...inventario.movimientos, nuevo] });
  return nuevo;
}

// RF-18
export function registrarEntrada(idProducto: number, cantidad: string, idResponsable: number): Resultado<MovimientoInventario> {
  const inventario = leerInventario();
  const producto = inventario.productos.find((p) => p.idProducto === idProducto);
  if (!producto) return { ok: false, error: "El producto no existe." };
  const error = validarCantidad(cantidad);
  if (error) return { ok: false, error };
  const dato = aplicarMovimiento(inventario, producto, {
    tipo: "Entrada",
    cantidad: Number(cantidad),
    motivo: "Entrada manual de inventario",
    idResponsable,
  });
  return { ok: true, dato };
}

// RF-19
export function registrarAjuste(
  idProducto: number,
  tipo: "Ajuste positivo" | "Ajuste negativo",
  cantidad: string,
  motivo: string,
  idResponsable: number
): Resultado<MovimientoInventario> {
  const inventario = leerInventario();
  const producto = inventario.productos.find((p) => p.idProducto === idProducto);
  if (!producto) return { ok: false, error: "El producto no existe." };
  const errores = validarAjuste(producto.existencias, tipo, cantidad, motivo);
  const error = errores.cantidad ?? errores.motivo;
  if (error) return { ok: false, error };
  const dato = aplicarMovimiento(inventario, producto, { tipo, cantidad: Number(cantidad), motivo: motivo.trim(), idResponsable });
  return { ok: true, dato };
}