export type Categoria = {
  idCategoria: number;
  nombre: string;
  descripcion: string;
  simbolo: string;
};

export type Producto = {
  idProducto: number;
  idCategoria: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  existencias: number;
  imagenUrl: string;
};

export type TipoMovimiento = "Entrada" | "Ajuste positivo" | "Ajuste negativo" | "Descuento";

export type MovimientoInventario = {
  idMovimiento: number;
  idProducto: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  fecha: string;
  idResponsable: number | null;
  responsable: string | null;
  idPedido: number | null;
  idEjecucion: number | null;
};