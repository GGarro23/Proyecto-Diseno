
import {
  ErrorApi,
  exito,
  leerCuerpo,
  manejar,
} from "@/lib/respuesta";

import {
  consultarCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
} from "@/modules/ventas-pagos/service";

// Validar que los datos recibidos sean enteros positivos.
function enteroPositivo(valor: unknown): number {
  if (
    typeof valor !== "number" ||
    !Number.isSafeInteger(valor) ||
    valor <= 0
  ) {
    throw new ErrorApi(
      400,
      "Los identificadores y cantidades deben ser enteros positivos."
    );
  }

  return valor;
}

// GET /api/carrito
// Consultar el carrito del usuario autenticado.
export function GET() {
  return manejar(async () => {
    const carrito = await consultarCarrito();
    return exito(carrito);
  });
}

// POST /api/carrito
// Agregar un producto al carrito.
export function POST(peticion: Request) {
  return manejar(async () => {
    const datos = await leerCuerpo<{
      idProducto: unknown;
      cantidad: unknown;
    }>(peticion);

    const idProducto = enteroPositivo(datos?.idProducto);
    const cantidad = enteroPositivo(datos?.cantidad);

    const resultado = await agregarAlCarrito(
      idProducto,
      cantidad
    );

    return exito(resultado, 201);
  });
}

// PATCH /api/carrito
// Cambiar la cantidad de un producto del carrito.
export function PATCH(peticion: Request) {
  return manejar(async () => {
    const datos = await leerCuerpo<{
      idProducto: unknown;
      cantidad: unknown;
    }>(peticion);

    const idProducto = enteroPositivo(datos?.idProducto);
    const cantidad = enteroPositivo(datos?.cantidad);

    const resultado = await actualizarCantidad(
      idProducto,
      cantidad
    );

    return exito(resultado);
  });
}

// DELETE /api/carrito
// Eliminar un producto del carrito.
export function DELETE(peticion: Request) {
  return manejar(async () => {
    const datos = await leerCuerpo<{
      idProducto: unknown;
    }>(peticion);

    const idProducto = enteroPositivo(datos?.idProducto);

    const resultado = await eliminarDelCarrito(
      idProducto
    );

    return exito(resultado);
  });
}
