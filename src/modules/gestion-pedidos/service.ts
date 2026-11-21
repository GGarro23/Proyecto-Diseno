
import { ErrorApi } from "@/lib/respuesta";

import {
  requerirSesion,
  requerirRol,
} from "@/modules/autenticacion-usuarios/service";

import * as repositorio from "./repository";

// Validar identificadores.
function validarIdPedido(idPedido: number) {
  if (!Number.isSafeInteger(idPedido) || idPedido <= 0) {
    throw new ErrorApi(
      400,
      "El identificador del pedido no es válido."
    );
  }
}

// Consultar todos los pedidos.
// Solo Encargado de pedidos y Administrador.
export async function consultarPedidos() {
  await requerirRol("Encargado de pedidos", "Administrador");

  return repositorio.listarPedidos();
}

// Consultar un pedido y sus productos.
export async function consultarDetallePedido(idPedido: number) {
  const sesion = await requerirSesion();

  validarIdPedido(idPedido);

  const pedido = await repositorio.obtenerPedido(idPedido);

  if (!pedido) {
    throw new ErrorApi(404, "Pedido no encontrado.");
  }

  const puedeConsultarTodos = sesion.roles.some(
    (rol) =>
      rol === "Encargado de pedidos" ||
      rol === "Administrador"
  );

  // Un cliente solamente puede consultar sus pedidos.
  if (
    !puedeConsultarTodos &&
    Number(pedido.idUsuario) !== sesion.usuario.idUsuario
  ) {
    throw new ErrorApi(404, "Pedido no encontrado.");
  }

  const productos = await repositorio.obtenerDetallePedido(
    idPedido
  );

  const historial = await repositorio.obtenerHistorialPedido(
    idPedido
  );

  return {
    ...pedido,
    productos,
    historial,
  };
}

// Actualizar el estado operativo de un pedido.
// Solamente puede hacerlo el Encargado de pedidos.
export async function cambiarEstadoPedido(
  idPedido: number,
  estadoNuevo: string
) {
  const sesion = await requerirRol("Encargado de pedidos");

  validarIdPedido(idPedido);

  const estadosValidos = [
    "EN_PREPARACION",
    "EMPACADO",
    "ENVIADO",
    "LISTO_RETIRO",
    "RETIRADO",
  ];

  if (!estadosValidos.includes(estadoNuevo)) {
    throw new ErrorApi(
      400,
      "El estado solicitado no es válido."
    );
  }

  const pedido = await repositorio.obtenerPedido(idPedido);

  if (!pedido) {
    throw new ErrorApi(404, "Pedido no encontrado.");
  }

  if (pedido.estadoPago !== "CONFIRMADO") {
    throw new ErrorApi(
      409,
      "Solo se pueden actualizar pedidos confirmados."
    );
  }

  const transiciones: Record<string, Record<string, string>> = {
    ENVIO: {
      PENDIENTE: "EN_PREPARACION",
      EN_PREPARACION: "EMPACADO",
      EMPACADO: "ENVIADO",
    },
    RETIRO: {
      PENDIENTE: "EN_PREPARACION",
      EN_PREPARACION: "LISTO_RETIRO",
      LISTO_RETIRO: "RETIRADO",
    },
  };

  const siguienteEstado =
    transiciones[pedido.modalidadEntrega]?.[
      pedido.estadoOperativo
    ];

  if (siguienteEstado !== estadoNuevo) {
    throw new ErrorApi(
      409,
      "La transición de estado no está permitida."
    );
  }

  // PostgreSQL vuelve a validar la transición y
  // registra el cambio de forma atómica.
  const idCambio = await repositorio.avanzarEstadoPedido(
    idPedido,
    sesion.usuario.idUsuario,
    estadoNuevo
  );

  return {
    idPedido,
    idCambio,
    estadoAnterior: pedido.estadoOperativo,
    estadoNuevo,
    mensaje: "Estado del pedido actualizado correctamente.",
  };
}
