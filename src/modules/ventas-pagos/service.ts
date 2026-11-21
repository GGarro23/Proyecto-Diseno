
import { ErrorApi } from "@/lib/respuesta";
import { requerirSesion } from "@/modules/autenticacion-usuarios/service";
import * as repositorio from "./repository";
import {
  prepararNotificacionCompra,
  enviarYRegistrarNotificacion,
} from "@/modules/notificaciones/service";
function validarIdProducto(idProducto: number) {
  if (!Number.isSafeInteger(idProducto) || idProducto <= 0) {
    throw new ErrorApi(400, "El identificador del producto no es válido.");
  }
}

function validarCantidad(cantidad: number) {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new ErrorApi(400, "La cantidad debe ser un entero positivo.");
  }
}

function manejarErrorCarrito(error: unknown): never {
  if (error instanceof ErrorApi) {
    throw error;
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "La cantidad debe ser un entero positivo":
        throw new ErrorApi(400, error.message);

      case "El producto no está disponible":
        throw new ErrorApi(404, error.message);

      case "No hay existencias suficientes":
        throw new ErrorApi(409, error.message);

      case "Carrito no encontrado":
      case "El producto no está en el carrito":
        throw new ErrorApi(404, error.message);
    }
  }

  throw error;
}

export async function consultarCarrito() {
  const sesion = await requerirSesion();
  const idUsuario = sesion.usuario.idUsuario;

  const carrito = await repositorio.obtenerCarrito(idUsuario);

  if (!carrito) {
    return {
      idCarrito: null,
      productos: [],
      total: 0,
    };
  }

  const productos = await repositorio.obtenerLineasCarrito(
    carrito.idCarrito
  );

  const total = productos.reduce(
    (acumulado, producto) =>
      acumulado + Number(producto.subtotal),
    0
  );

  return {
    idCarrito: carrito.idCarrito,
    productos,
    total: Math.round(total * 100) / 100,
  };
}

export async function agregarAlCarrito(
  idProducto: number,
  cantidad: number
) {
  const sesion = await requerirSesion();

  validarIdProducto(idProducto);
  validarCantidad(cantidad);

  try {
    return await repositorio.agregarProductoCarrito(
      sesion.usuario.idUsuario,
      idProducto,
      cantidad
    );
  } catch (error) {
    manejarErrorCarrito(error);
  }
}

export async function actualizarCantidad(
  idProducto: number,
  cantidad: number
) {
  const sesion = await requerirSesion();

  validarIdProducto(idProducto);
  validarCantidad(cantidad);

  try {
    return await repositorio.actualizarCantidadCarrito(
      sesion.usuario.idUsuario,
      idProducto,
      cantidad
    );
  } catch (error) {
    manejarErrorCarrito(error);
  }
}

export async function eliminarDelCarrito(idProducto: number) {
  const sesion = await requerirSesion();

  validarIdProducto(idProducto);

  try {
    return await repositorio.eliminarProductoCarrito(
      sesion.usuario.idUsuario,
      idProducto
    );
  } catch (error) {
    manejarErrorCarrito(error);
  }
}


export async function crearPedido(
  modalidadEntrega: "ENVIO" | "RETIRO",
  direccionEntrega: string | null
) {
  const sesion = await requerirSesion();
  const idUsuario = sesion.usuario.idUsuario;

  if (
    modalidadEntrega !== "ENVIO" &&
    modalidadEntrega !== "RETIRO"
  ) {
    throw new ErrorApi(
      400,
      "La modalidad de entrega no es válida."
    );
  }

  const direccion =
    typeof direccionEntrega === "string"
      ? direccionEntrega.trim()
      : null;

  if (modalidadEntrega === "ENVIO" && !direccion) {
    throw new ErrorApi(
      400,
      "Debes indicar una dirección para el envío."
    );
  }

  if (modalidadEntrega === "RETIRO" && direccion) {
    throw new ErrorApi(
      400,
      "El retiro presencial no requiere dirección."
    );
  }

  const carrito = await repositorio.obtenerCarrito(idUsuario);

  if (!carrito) {
    throw new ErrorApi(400, "Tu carrito está vacío.");
  }

  const productos = await repositorio.obtenerLineasCarrito(
    carrito.idCarrito
  );

  if (productos.length === 0) {
    throw new ErrorApi(400, "Tu carrito está vacío.");
  }

  const idPedido = await repositorio.crearPedidoDesdeCarrito(
    idUsuario,
    modalidadEntrega,
    modalidadEntrega === "ENVIO" ? direccion : null
  );

  return {
    idPedido,
    modalidadEntrega,
    estadoPago: "PENDIENTE",
    mensaje: "Pedido registrado correctamente. Pendiente de pago.",
  };
}


export async function simularPago(
  idPedido: number,
  codigoEscenario: "PAGO_OK" | "PAGO_RECHAZADO"
) {
  const sesion = await requerirSesion();
  const idUsuario = sesion.usuario.idUsuario;

  if (!Number.isSafeInteger(idPedido) || idPedido <= 0) {
    throw new ErrorApi(
      400,
      "El identificador del pedido no es válido."
    );
  }

  if (
    codigoEscenario !== "PAGO_OK" &&
    codigoEscenario !== "PAGO_RECHAZADO"
  ) {
    throw new ErrorApi(
      400,
      "El escenario de pago no es válido."
    );
  }

  const resultado = await repositorio.simularPagoPedido(
    idUsuario,
    idPedido,
    codigoEscenario
  );
if (resultado.resultadoConfirmacion === "CONFIRMADO") {
  try {
    const notificacion = await prepararNotificacionCompra(idPedido);

    await enviarYRegistrarNotificacion(notificacion);
  } catch (error) {
    console.error(
      "No se pudo procesar la notificación de compra:",
      error
    );
  }
}
  return {
    idPedido,
    resultadoSimulacion: resultado.resultadoSimulacion,
    resultadoConfirmacion: resultado.resultadoConfirmacion,
    mensaje:
      resultado.resultadoConfirmacion === "CONFIRMADO"
        ? "Pago simulado aprobado. Pedido confirmado."
        : resultado.resultadoConfirmacion === "RECHAZADO_STOCK"
          ? "Pago simulado aprobado, pero no hay existencias suficientes."
          : "Pago simulado rechazado.",
  };
}
