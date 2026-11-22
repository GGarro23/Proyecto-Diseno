
/**
 * Consultas a los reportes reales de Intervallum.
 *
 * Todas las rutas requieren el rol Administrador
 * y validan los permisos desde el backend.
 */

export type VentaReporte = {
  idPedido: number;
  idUsuario: number;
  fechaConfirmacion: string;
  modalidadEntrega: string;
  idProducto: number;
  codigoProducto: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number | string;
  subtotalLinea: number | string;
};

export type ReporteVentas = {
  fechaInicio: string;
  fechaFin: string;
  totalIngresos: number;
  unidadesVendidas: number;
  pedidosConfirmados: number;
  ventas: VentaReporte[];
};

export type ProductoReporte = {
  idProducto: number;
  codigo: string;
  nombre: string;
  precio: number | string;
  activo: boolean;
  idCategoria: number;
  categoria: string;
  existencias: number;
};

export type ReporteInventario = {
  totalProductos: number;
  productosActivos: number;
  productosSinExistencias: number;
  productos: ProductoReporte[];
};

export type CursoReporte = {
  idCurso: number;
  curso: string;
  estado: string;
  cupoMaximo: number;
  inscritosConfirmados: number;
  cuposDisponibles: number;
};

export type ReporteAcademia = {
  totalCursos: number;
  totalCupos: number;
  totalInscritos: number;
  porcentajeOcupacion: number;
  cursos: CursoReporte[];
};

type RespuestaApi<T> =
  | { ok: true; dato: T }
  | { ok: false; error: string };

async function consultarReporte<T>(
  ruta: string
): Promise<RespuestaApi<T>> {
  try {
    const respuesta = await fetch(ruta, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    const resultado: RespuestaApi<T> =
      await respuesta.json();

    if (!respuesta.ok) {
      return {
        ok: false,
        error: resultado.ok
          ? "No se pudo consultar el reporte."
          : resultado.error,
      };
    }

    return resultado;
  } catch {
    return {
      ok: false,
      error: "No fue posible conectar con el servidor.",
    };
  }
}

/**
 * Consulta ventas confirmadas en un rango de fechas.
 *
 * Las fechas deben utilizar YYYY-MM-DD.
 */
export function apiReporteVentas(
  fechaInicio: string,
  fechaFin: string
) {
  const parametros = new URLSearchParams({
    fechaInicio,
    fechaFin,
  });

  return consultarReporte<ReporteVentas>(
    `/api/reportes/ventas?${parametros.toString()}`
  );
}

/**
 * Consulta productos y existencias reales.
 */
export function apiReporteInventario() {
  return consultarReporte<ReporteInventario>(
    "/api/reportes/inventario"
  );
}

/**
 * Consulta cupos y ocupación académica.
 */
export function apiReporteAcademia() {
  return consultarReporte<ReporteAcademia>(
    "/api/reportes/academia"
  );
}
