import { consulta, transaccion } from "@/lib/db";

// Obtener el carrito de un usuario.
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

// Obtener los productos incluidos en un carrito.
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

/**
 * Agrega un producto al carrito.
 * Si ya existe, aumenta su cantidad.
 */
export async function agregarProductoCarrito(
  idUsuario: number,
  idProducto: number,
  cantidad: number
) {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad debe ser un entero positivo");
  }

  return transaccion(async (cliente) => {
    // Crear el carrito si todavía no existe.
    const carrito = await cliente.query<{ id_carrito: number }>(
      `INSERT INTO carrito (id_usuario)
       VALUES ($1)
       ON CONFLICT (id_usuario)
       DO UPDATE SET id_usuario = EXCLUDED.id_usuario
       RETURNING id_carrito`,
      [idUsuario]
    );

    const idCarrito = carrito.rows[0].id_carrito;

    // Bloquear el producto y comprobar disponibilidad.
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

/**
 * Modifica la cantidad de un producto del carrito.
 */
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

/**
 * Elimina un producto del carrito del usuario.
 */
export async function eliminarProductoCarrito(
  idUsuario: number,
  idProducto: number
) {
  const resultado = await consulta(
    `DELETE FROM linea_carrito
     WHERE id_producto = $2
       AND id_carrito IN (
         SELECT id_carrito FROM carrito
         WHERE id_usuario = $1
       )
     RETURNING id_producto`,
    [idUsuario, idProducto]
  );

  if (resultado.length === 0) {
    throw new Error("El producto no está en el carrito");
  }

  return { eliminado: true, idProducto };
}


/**
 * Crea un pedido pendiente a partir del carrito.
 *
 * La base de datos valida los productos,
 * las existencias y calcula el total.
 *
 * No confirma el pago ni descuenta inventario.
 */
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


/**
 * Simula el pago de un pedido.
 *
 * PAGO_OK: intenta confirmar el pedido.
 * PAGO_RECHAZADO: registra un intento rechazado.
 *
 * PostgreSQL gestiona el inventario y los cambios
 * de estado dentro de la misma transacción.
 */
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


// Consultar los pedidos registrados.
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

// Consultar un pedido por su identificador.
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

// Obtener los productos de un pedido.
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

// Consultar el historial de cambios de estado.
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

// Actualizar el estado utilizando la función SQL existente.
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
