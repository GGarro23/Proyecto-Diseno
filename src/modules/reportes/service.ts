
import { ErrorApi } from "@/lib/respuesta";
import { requerirRol } from "@/modules/autenticacion-usuarios/service";
import * as repositorio from "./repository";

// Verificar que una fecha tenga formato YYYY-MM-DD
// y corresponda a una fecha válida.
function validarFecha(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const valor = new Date(`${fecha}T00:00:00Z`);

  return (
    !Number.isNaN(valor.getTime()) &&
    valor.toISOString().slice(0, 10) === fecha
  );
}

/**
 * Reporte de ventas confirmadas.
 * Solo disponible para Administrador.
 */
export async function consultarReporteVentas(
  fechaInicio: string,
  fechaFin: string
) {
  await requerirRol("Administrador");

  if (!validarFecha(fechaInicio) || !validarFecha(fechaFin)) {
    throw new ErrorApi(
      400,
      "Las fechas deben tener el formato YYYY-MM-DD y ser válidas."
    );
  }

  if (fechaInicio > fechaFin) {
    throw new ErrorApi(
      400,
      "La fecha inicial no puede ser posterior a la fecha final."
    );
  }

  const ventas = await repositorio.obtenerReporteVentas(
    fechaInicio,
    fechaFin
  );

  const totalIngresos = ventas.reduce(
    (total, venta) => total + Number(venta.subtotalLinea),
    0
  );

  const unidadesVendidas = ventas.reduce(
    (total, venta) => total + Number(venta.cantidad),
    0
  );

  const pedidosConfirmados = new Set(
    ventas.map((venta) => venta.idPedido)
  ).size;

  return {
    fechaInicio,
    fechaFin,
    totalIngresos: Math.round(totalIngresos * 100) / 100,
    unidadesVendidas,
    pedidosConfirmados,
    ventas,
  };
}

/**
 * Reporte de inventario.
 * Solo disponible para Administrador.
 */
export async function consultarReporteInventario() {
  await requerirRol("Administrador");

  const productos = await repositorio.obtenerReporteInventario();

  return {
    totalProductos: productos.length,
    productosActivos: productos.filter(
      (producto) => producto.activo
    ).length,
    productosSinExistencias: productos.filter(
      (producto) => Number(producto.existencias) === 0
    ).length,
    productos,
  };
}

/**
 * Reporte de ocupación académica.
 * Solo disponible para Administrador.
 */
export async function consultarReporteAcademia() {
  await requerirRol("Administrador");

  const cursos = await repositorio.obtenerReporteAcademia();

  const totalCupos = cursos.reduce(
    (total, curso) => total + Number(curso.cupoMaximo),
    0
  );

  const totalInscritos = cursos.reduce(
    (total, curso) => total + Number(curso.inscritosConfirmados),
    0
  );

  return {
    totalCursos: cursos.length,
    totalCupos,
    totalInscritos,
    porcentajeOcupacion:
      totalCupos > 0
        ? Math.round((totalInscritos / totalCupos) * 10000) / 100
        : 0,
    cursos,
  };
}
