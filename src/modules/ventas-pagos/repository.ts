import { consulta, transaccion } from "@/lib/db";

export async function obtenerCarrito(idUsuario: number) {
  const filas = await consulta<{
    idCarrito: number;
    idUsuario: number;
  }>(
    `SELECT
       id_carrito AS "idCarrito",
       id_usuario AS "idUsuario"
     FROM carrito
     WHERE id_usuario = $1`,
    [idUsuario]
  );

  return filas[0] ?? null;
}

export async function obtenerLineasCarrito(idCarrito: number) {
  return consulta<{
    idProducto: number;
    nombre: string;
    precio: number;
    cantidad: number;
    subtotal: number;
    existencias: number;
  }>(
    `SELECT
       lc.id_producto AS "idProducto",
       p.nombre,
       p.precio,
       lc.cantidad,
       (p.precio * lc.cantidad) AS subtotal,
       p.existencias
     FROM linea_carrito lc
     JOIN producto p
       ON p.id_producto = lc.id_producto
     WHERE lc.id_carrito = $1
     ORDER BY p.nombre`,
    [idCarrito]
  );
}

export async function agregarProductoCarrito(
  idUsuario: number,
  idProducto: number,
  cantidad: number
) {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad debe ser un entero positivo");
  }

  return transaccion(async (cliente) => {
    const carrito = await cliente.query<{ id_carrito: number }>(
      `INSERT INTO carrito (id_usuario)
       VALUES ($1)
       ON CONFLICT (id_usuario)
       DO UPDATE SET id_usuario = EXCLUDED.id_usuario
       RETURNING id_carrito`,
      [idUsuario]
    );

    const idCarrito = carrito.rows[0].id_carrito;

    const producto = await cliente.query<{
      activo: boolean;
      existencias: number;
    }>(
      `SELECT activo, existencias
       FROM producto
       WHERE id_producto = $1
       FOR UPDATE`,
      [idProducto]
    );

    if (!producto.rows[0] || !producto.rows[0].activo) {
      throw new Error("El producto no está disponible");
    }

    const resultado = await cliente.query(
      `INSERT INTO linea_carrito
         (id_carrito, id_producto, cantidad)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_carrito, id_producto)
       DO UPDATE SET cantidad =
         linea_carrito.cantidad + EXCLUDED.cantidad
       RETURNING cantidad`,
      [idCarrito, idProducto, cantidad]
    );

    const nuevaCantidad = Number(resultado.rows[0].cantidad);

    if (nuevaCantidad > producto.rows[0].existencias) {
      throw new Error("No hay existencias suficientes");
    }

    return {
      idCarrito,
      idProducto,
      cantidad: nuevaCantidad,
    };
  });
}

export async function actualizarCantidadCarrito(
  idUsuario: number,
  idProducto: number,
  cantidad: number
) {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad debe ser un entero positivo");
  }

  return transaccion(async (cliente) => {
    const carrito = await cliente.query<{ id_carrito: number }>(
      `SELECT id_carrito FROM carrito
       WHERE id_usuario = $1 FOR UPDATE`,
      [idUsuario]
    );

    if (!carrito.rows[0]) {
      throw new Error("Carrito no encontrado");
    }

    const producto = await cliente.query<{
      activo: boolean;
      existencias: number;
    }>(
      `SELECT activo, existencias FROM producto
       WHERE id_producto = $1 FOR UPDATE`,
      [idProducto]
    );

    if (!producto.rows[0] || !producto.rows[0].activo) {
      throw new Error("El producto no está disponible");
    }

    if (cantidad > producto.rows[0].existencias) {
      throw new Error("No hay existencias suficientes");
    }

    const resultado = await cliente.query(
      `UPDATE linea_carrito
       SET cantidad = $3
       WHERE id_carrito = $1 AND id_producto = $2
       RETURNING id_producto`,
      [carrito.rows[0].id_carrito, idProducto, cantidad]
    );

    if (resultado.rowCount === 0) {
      throw new Error("El producto no está en el carrito");
    }

    return { idProducto, cantidad };
  });
}

export async function eliminarProductoCarrito(
  idUsuario: number,
  idProducto: number
) {
  return transaccion(async (cliente) => {
    const carrito = await cliente.query<{
      id_carrito: number;
    }>(
      `SELECT id_carrito
       FROM carrito
       WHERE id_usuario = $1
       FOR UPDATE`,
      [idUsuario]
    );

    if (!carrito.rows[0]) {
      throw new Error("Carrito no encontrado");
    }

    const resultado = await cliente.query(
      `DELETE FROM linea_carrito
       WHERE id_carrito = $1
         AND id_producto = $2
       RETURNING id_producto`,
      [carrito.rows[0].id_carrito, idProducto]
    );

    if (resultado.rowCount === 0) {
      throw new Error("El producto no está en el carrito");
    }

    return {
      eliminado: true,
      idProducto,
    };
  });
}



export async function crearPedidoDesdeCarrito(
  idUsuario: number,
  modalidadEntrega: "ENVIO" | "RETIRO",
  direccionEntrega: string | null
): Promise<number> {
  const resultado = await consulta<{
    idPedido: string;
  }>(
    `SELECT crear_pedido_desde_carrito(
       $1::BIGINT,
       $2::VARCHAR,
       $3::TEXT
     )::TEXT AS "idPedido"`,
    [idUsuario, modalidadEntrega, direccionEntrega]
  );

  return Number(resultado[0].idPedido);
}


export async function simularPagoPedido(
  idUsuario: number,
  idPedido: number,
  codigoEscenario: "PAGO_OK" | "PAGO_RECHAZADO"
) {
  const resultado = await consulta<{
    resultadoSimulacion: string;
    resultadoConfirmacion: string;
  }>(
    `SELECT
       resultado_simulacion AS "resultadoSimulacion",
       resultado_confirmacion AS "resultadoConfirmacion"
     FROM simular_pago_pedido(
       $1::BIGINT,
       $2::BIGINT,
       $3::VARCHAR
     )`,
    [idUsuario, idPedido, codigoEscenario]
  );

  return resultado[0];
}
