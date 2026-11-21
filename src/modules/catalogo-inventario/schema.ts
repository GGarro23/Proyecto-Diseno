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

// La dirección del ajuste (RF-19) va en el tipo. La cantidad siempre es positiva.
export type TipoMovimiento = "Entrada" | "Ajuste positivo" | "Ajuste negativo" | "Descuento";

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