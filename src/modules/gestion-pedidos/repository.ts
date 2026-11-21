
import { consulta } from "@/lib/db";

export async function listarPedidos() {
  return consulta<{
    idPedido: number;
    idUsuario: number;
    fechaCreacion: Date;
    total: number;
    modalidadEntrega: string;
    estadoPago: string;
    estadoOperativo: string;
  }>(
    `SELECT
       id_pedido AS "idPedido",
       id_usuario AS "idUsuario",
       fecha_creacion AS "fechaCreacion",
       total,
       modalidad_entrega AS "modalidadEntrega",
       estado_pago AS "estadoPago",
       estado_operativo AS "estadoOperativo"
     FROM pedido
     ORDER BY fecha_creacion DESC, id_pedido DESC`
  );
}

export async function obtenerPedido(idPedido: number) {
  const filas = await consulta<{
    idPedido: number;
    idUsuario: number;
    fechaCreacion: Date;
    total: number;
    modalidadEntrega: string;
    direccionEntrega: string | null;
    estadoPago: string;
    estadoOperativo: string;
  }>(
    `SELECT
       id_pedido AS "idPedido",
       id_usuario AS "idUsuario",
       fecha_creacion AS "fechaCreacion",
       total,
       modalidad_entrega AS "modalidadEntrega",
       direccion_entrega AS "direccionEntrega",
       estado_pago AS "estadoPago",
       estado_operativo AS "estadoOperativo"
     FROM pedido
     WHERE id_pedido = $1`,
    [idPedido]
  );

  return filas[0] ?? null;
}

export async function obtenerDetallePedido(idPedido: number) {
  return consulta<{
    idProducto: number;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>(
    `SELECT
       d.id_producto AS "idProducto",
       p.nombre,
       d.cantidad,
       d.precio_unitario AS "precioUnitario",
       (d.cantidad * d.precio_unitario) AS subtotal
     FROM detalle_pedido d
     JOIN producto p
       ON p.id_producto = d.id_producto
     WHERE d.id_pedido = $1
     ORDER BY p.nombre`,
    [idPedido]
  );
}

export async function obtenerHistorialPedido(idPedido: number) {
  return consulta<{
    idCambio: number;
    estadoAnterior: string;
    estadoNuevo: string;
    fechaCambio: Date;
    idResponsable: number;
  }>(
    `SELECT
       id_cambio AS "idCambio",
       estado_anterior AS "estadoAnterior",
       estado_nuevo AS "estadoNuevo",
       fecha_cambio AS "fechaCambio",
       id_responsable AS "idResponsable"
     FROM historial_estado_pedido
     WHERE id_pedido = $1
     ORDER BY fecha_cambio DESC, id_cambio DESC`,
    [idPedido]
  );
}

export async function avanzarEstadoPedido(
  idPedido: number,
  idResponsable: number,
  estadoNuevo: string
) {
  const filas = await consulta<{
    idCambio: number;
  }>(
    `SELECT avanzar_estado_pedido(
       $1::BIGINT,
       $2::BIGINT,
       $3::VARCHAR
     ) AS "idCambio"`,
    [idPedido, idResponsable, estadoNuevo]
  );

  return filas[0].idCambio;
}

export async function listarPedidosUsuario(
  idUsuario: number
) {
  return consulta<{
    idPedido: number;
    idUsuario: number;
    fechaCreacion: Date;
    total: number | string;
    modalidadEntrega: string;
    estadoPago: string;
    estadoOperativo: string;
  }>(
    `SELECT
       id_pedido AS "idPedido",
       id_usuario AS "idUsuario",
       fecha_creacion AS "fechaCreacion",
       total,
       modalidad_entrega AS "modalidadEntrega",
       estado_pago AS "estadoPago",
       estado_operativo AS "estadoOperativo"
     FROM pedido
     WHERE id_usuario = $1
     ORDER BY fecha_creacion DESC, id_pedido DESC`,
    [idUsuario]
  );
}
