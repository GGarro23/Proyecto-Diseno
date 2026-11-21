import {
  exito,
  manejar,
} from "@/lib/respuesta";

import { consulta } from "@/lib/db";
import { transaccion } from "@/lib/db";
import { ErrorApi, leerCuerpo } from "@/lib/respuesta";
import {validarCantidad,validarAjuste,} from "@/modules/catalogo-inventario/validaciones";
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

type SolicitudMovimiento = {
  idProducto: number;
  tipo: "Entrada" | "Ajuste positivo" | "Ajuste negativo";
  cantidad: string;
  motivo?: string;
};

// RF-18 y RF-19: registrar movimientos reales.
export function POST(peticion: Request) {
  return manejar(async () => {
    const sesion = await requerirPermiso(
      "catalogo.administrar"
    );

    const datos =
      await leerCuerpo<SolicitudMovimiento>(peticion);

    if (
      !datos ||
      !Number.isSafeInteger(datos.idProducto) ||
      datos.idProducto <= 0
    ) {
      throw new ErrorApi(400, "Producto inválido.");
    }

    if (
      datos.tipo !== "Entrada" &&
      datos.tipo !== "Ajuste positivo" &&
      datos.tipo !== "Ajuste negativo"
    ) {
      throw new ErrorApi(400, "Tipo de movimiento inválido.");
    }

    if (typeof datos.cantidad !== "string") {
      throw new ErrorApi(400, "Cantidad inválida.");
    }

    const errorCantidad = validarCantidad(datos.cantidad);

    if (errorCantidad) {
      throw new ErrorApi(400, errorCantidad);
    }

    const cantidad = Number(datos.cantidad);

    if (!Number.isSafeInteger(cantidad)) {
      throw new ErrorApi(400, "Cantidad fuera del rango permitido.");
    }

    const motivo =
      typeof datos.motivo === "string"
        ? datos.motivo.trim()
        : "";

    const tiposSQL = {
      Entrada: "ENTRADA_MANUAL",
      "Ajuste positivo": "AJUSTE_POSITIVO",
      "Ajuste negativo": "AJUSTE_NEGATIVO",
    } as const;

    const resultado = await transaccion(async (cliente) => {
      // Bloquear la fila para evitar actualizaciones concurrentes.
      const consultaProducto = await cliente.query<{
        existencias: number;
        activo: boolean;
        nombre: string;
      }>(
        `SELECT existencias, activo, nombre
         FROM producto
         WHERE id_producto = $1
         FOR UPDATE`,
        [datos.idProducto]
      );

      const producto = consultaProducto.rows[0];

      if (!producto || !producto.activo) {
        throw new ErrorApi(
          404,
          "El producto no existe o está desactivado."
        );
      }

      if (datos.tipo !== "Entrada") {
        const errores = validarAjuste(
          producto.existencias,
          datos.tipo,
          datos.cantidad,
          motivo
        );

        if (errores.cantidad || errores.motivo) {
          throw new ErrorApi(
            400,
            errores.cantidad ??
              errores.motivo ??
              "Ajuste inválido."
          );
        }
      }

      const cambio =
        datos.tipo === "Ajuste negativo"
          ? -cantidad
          : cantidad;

      const nuevasExistencias =
        producto.existencias + cambio;

      if (
        !Number.isSafeInteger(nuevasExistencias) ||
        nuevasExistencias < 0 ||
        nuevasExistencias > 2147483647
      ) {
        throw new ErrorApi(
          400,
          "Las existencias resultantes no son válidas."
        );
      }

      await cliente.query(
        `UPDATE producto
         SET existencias = $1
         WHERE id_producto = $2`,
        [nuevasExistencias, datos.idProducto]
      );

      const movimiento = await cliente.query<{
        idMovimiento: number;
      }>(
        `INSERT INTO movimiento_inventario
          (id_producto, tipo, cantidad, motivo, id_responsable)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_movimiento AS "idMovimiento"`,
        [
          datos.idProducto,
          tiposSQL[datos.tipo],
          cantidad,
          datos.tipo === "Entrada"
            ? "Entrada manual de inventario"
            : motivo,
          sesion.usuario.idUsuario,
        ]
      );

      return {
        idMovimiento: movimiento.rows[0].idMovimiento,
        idProducto: datos.idProducto,
        nombre: producto.nombre,
        tipo: datos.tipo,
        cantidad,
        existencias: nuevasExistencias,
      };
    });

    return exito(resultado, 201);
  });
}
