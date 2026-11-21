// AF-02 Catálogo e inventario

export type Categoria = {
  idCategoria: number;
  nombre: string;
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
  imagenUrl: string; // no está en el modelo (Figuras 11–13)
};

// PENDIENTE: RF-19 pide indicar si el ajuste aumenta o disminuye,
// y el modelo no define cómo. Confirmar con el compañero.
export type TipoMovimiento = string;

export type MovimientoInventario = {
  idMovimiento: number;
  idProducto: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  fecha: string;
  idResponsable: number | null; // movimientos manuales (RI-05)
  idPedido: number | null;      // descuento por compra (RI-05)
  idEjecucion: number | null;   // entrada por ETL (RI-05)
};