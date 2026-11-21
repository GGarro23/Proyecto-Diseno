
import { consulta } from "@/lib/db";

export async function obtenerReporteVentas(
  fechaInicio: string,
  fechaFin: string
) {
  return consulta<{
    idPedido: number;
    idUsuario: number;
    fechaConfirmacion: Date;
    modalidadEntrega: string;
    idProducto: number;
    codigoProducto: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    subtotalLinea: number;
  }>(
    `SELECT
       id_pedido AS "idPedido",
       id_usuario AS "idUsuario",
       fecha_confirmacion AS "fechaConfirmacion",
       modalidad_entrega AS "modalidadEntrega",
       id_producto AS "idProducto",
       codigo_producto AS "codigoProducto",
       nombre_producto AS "nombreProducto",
       cantidad,
       precio_unitario AS "precioUnitario",
       subtotal_linea AS "subtotalLinea"
     FROM vw_reporte_ventas_confirmadas
     WHERE fecha_confirmacion >= $1::DATE
       AND fecha_confirmacion < ($2::DATE + INTERVAL '1 day')
     ORDER BY fecha_confirmacion DESC, id_pedido DESC`,
    [fechaInicio, fechaFin]
  );
}

export async function obtenerReporteInventario() {
  return consulta<{
    idProducto: number;
    codigo: string;
    nombre: string;
    precio: number;
    activo: boolean;
    idCategoria: number;
    categoria: string;
    existencias: number;
  }>(
    `SELECT
       id_producto AS "idProducto",
       codigo,
       nombre,
       precio,
       activo,
       id_categoria AS "idCategoria",
       categoria,
       existencias
     FROM vw_reporte_inventario
     ORDER BY categoria, nombre`
  );
}

export async function obtenerReporteAcademia() {
  return consulta<{
    idCurso: number;
    curso: string;
    estado: string;
    cupoMaximo: number;
    inscritosConfirmados: number;
    cuposDisponibles: number;
  }>(
    `SELECT
       id_curso AS "idCurso",
       curso,
       estado,
       cupo_maximo AS "cupoMaximo",
       inscritos_confirmados AS "inscritosConfirmados",
       cupos_disponibles AS "cuposDisponibles"
     FROM vw_reporte_ocupacion_academica
     ORDER BY curso`
  );
}
