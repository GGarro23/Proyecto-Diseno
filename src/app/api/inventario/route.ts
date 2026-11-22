import {
  exito,
  manejar,
} from "@/lib/respuesta";

import { consulta } from "@/lib/db";

import { requerirPermiso } from
  "@/modules/autenticacion-usuarios/service";

import type {
  Categoria,
  Producto,
  MovimientoInventario,
} from "@/modules/catalogo-inventario/schema";

// RF-17: Consultar inventario y movimientos reales.
// Requiere permiso de administración del catálogo.
export function GET() {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");

    const [productos, categorias, movimientos] =
      await Promise.all([
        consulta<Producto>(`
          SELECT
            id_producto AS "idProducto",
            id_categoria AS "idCategoria",
            codigo,
            nombre,
            COALESCE(descripcion, '') AS descripcion,
            precio,
            activo,
            existencias,
            COALESCE(imagen_url, '') AS "imagenUrl"
          FROM producto
          ORDER BY nombre
        `),

        consulta<Categoria>(`
          SELECT
            id_categoria AS "idCategoria",
            nombre
          FROM categoria
          ORDER BY nombre
        `),

        consulta<MovimientoInventario>(`
          SELECT
            id_movimiento AS "idMovimiento",
            id_producto AS "idProducto",

            CASE tipo
              WHEN 'ENTRADA_MANUAL' THEN 'Entrada'
              WHEN 'ENTRADA_ETL' THEN 'Entrada'
              WHEN 'AJUSTE_POSITIVO' THEN 'Ajuste positivo'
              WHEN 'AJUSTE_NEGATIVO' THEN 'Ajuste negativo'
              WHEN 'VENTA' THEN 'Descuento'
            END AS tipo,

            cantidad,
            COALESCE(motivo, '') AS motivo,
            fecha,
            id_responsable AS "idResponsable",
            id_pedido AS "idPedido",
            id_ejecucion AS "idEjecucion"

          FROM movimiento_inventario
          ORDER BY fecha ASC, id_movimiento ASC
        `),
      ]);

    return exito({
      productos,
      categorias,
      movimientos,
    });
  });
}
