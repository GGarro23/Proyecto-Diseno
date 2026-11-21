
"use client";

import { useEffect, useState } from "react";

import { Insignia, Sobretitulo } from "@/components/ui/textos";
import { formatearColones } from "@/lib/formato";

import {
  apiReporteVentas,
  apiReporteInventario,
  apiReporteAcademia,
  type ReporteVentas,
  type ReporteInventario,
  type ReporteAcademia,
} from "@/lib/api-reportes";

import {
  apiListarPedidos,
  apiDetallePedido,
  type PedidoGestion,
  type CambioEstadoPedido,
} from "@/lib/api-pedidos";

import { UMBRAL_INVENTARIO_BAJO } from "@/modules/catalogo-inventario/reglas";
import { MESES } from "@/modules/reportes/reportes";

type EstadoCarga<T> = {
  datos: T | null;
  cargando: boolean;
  error: string | null;
};

type DatosPedidos = {
  pedidos: PedidoGestion[];
  cambios: CambioEstadoPedido[];
};

function estadoInicial<T>(): EstadoCarga<T> {
  return {
    datos: null,
    cargando: true,
    error: null,
  };
}

function valorCarga<T>(
  estado: EstadoCarga<T>,
  valor: string
): string {
  if (estado.cargando) return "Cargando...";
  if (estado.error) return "No disponible";
  return valor;
}

const ETIQUETAS_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "En preparación",
  EMPACADO: "Empacado",
  ENVIADO: "Enviado",
  LISTO_RETIRO: "Listo para retiro",
  RETIRADO: "Retirado",
};

// RF-44: Panel del Administrador con información real.
export function ResumenAdmin() {
  const anioActual = new Date().getFullYear();

  const [anio, setAnio] = useState(anioActual);

  const anios = [
    anioActual,
    anioActual - 1,
    anioActual - 2,
  ];

  const [ventasEstado, setVentasEstado] = useState<
    EstadoCarga<ReporteVentas> & { anio?: number }
  >(estadoInicial<ReporteVentas>());

  const [inventarioEstado, setInventarioEstado] =
    useState<EstadoCarga<ReporteInventario>>(
      estadoInicial<ReporteInventario>()
    );

  const [academiaEstado, setAcademiaEstado] =
    useState<EstadoCarga<ReporteAcademia>>(
      estadoInicial<ReporteAcademia>()
    );

  const [pedidosEstado, setPedidosEstado] =
    useState<EstadoCarga<DatosPedidos>>(
      estadoInicial<DatosPedidos>()
    );

  // ----------------------------------------
  // CARGAR REPORTE REAL DE VENTAS
  // ----------------------------------------

  useEffect(() => {
    let cancelado = false;

    async function cargarVentas() {
      await Promise.resolve();

      if (cancelado) return;

      setVentasEstado({
        datos: null,
        cargando: true,
        error: null,
        anio,
      });

      try {
        const resultado = await apiReporteVentas(
          `${anio}-01-01`,
          `${anio}-12-31`
        );

        if (cancelado) return;

        setVentasEstado({
          datos: resultado.ok ? resultado.dato : null,
          cargando: false,
          error: resultado.ok ? null : resultado.error,
          anio,
        });
      } catch {
        if (cancelado) return;

        setVentasEstado({
          datos: null,
          cargando: false,
          error: "No fue posible consultar las ventas.",
          anio,
        });
      }
    }

    void cargarVentas();

    return () => {
      cancelado = true;
    };
  }, [anio]);

  // ----------------------------------------
  // CARGAR INVENTARIO, ACADEMIA Y PEDIDOS
  // ----------------------------------------

  useEffect(() => {
    let cancelado = false;

    async function cargarDatos() {
      await Promise.resolve();

      if (cancelado) return;

      const [inventario, academia, pedidos] =
        await Promise.all([
          apiReporteInventario(),
          apiReporteAcademia(),
          apiListarPedidos(),
        ]);

      if (cancelado) return;

      setInventarioEstado({
        datos: inventario.ok ? inventario.dato : null,
        cargando: false,
        error: inventario.ok ? null : inventario.error,
      });

      setAcademiaEstado({
        datos: academia.ok ? academia.dato : null,
        cargando: false,
        error: academia.ok ? null : academia.error,
      });

      if (!pedidos.ok) {
        setPedidosEstado({
          datos: null,
          cargando: false,
          error: pedidos.error,
        });

        return;
      }

      // Solo pedidos con pago confirmado.
      const confirmados = pedidos.dato.filter(
        (pedido) => pedido.estadoPago === "CONFIRMADO"
      );

      // Recuperar el historial real de cada pedido.
      const detalles = await Promise.all(
        confirmados.map((pedido) =>
          apiDetallePedido(pedido.idPedido)
        )
      );

      if (cancelado) return;

      const hayErrores = detalles.some(
        (detalle) => !detalle.ok
      );

      if (hayErrores) {
        setPedidosEstado({
          datos: null,
          cargando: false,
          error:
            "No fue posible consultar el historial de todos los pedidos.",
        });

        return;
      }

      const cambios = detalles.flatMap(
        (detalle, indice) => {
          if (!detalle.ok) return [];

          return detalle.dato.historial.map(
            (cambio) => ({
              ...cambio,
              idPedido: confirmados[indice].idPedido,
            })
          );
        }
      );

      setPedidosEstado({
        datos: {
          pedidos: confirmados,
          cambios,
        },
        cargando: false,
        error: null,
      });
    }

    void cargarDatos();

    return () => {
      cancelado = true;
    };
  }, []);

  // ----------------------------------------
  // CALCULAR INDICADORES DE VENTAS
  // ----------------------------------------

  const ventas =
    ventasEstado.anio === anio
      ? ventasEstado.datos
      : null;

  const meses = Array<number>(12).fill(0);

  for (const venta of ventas?.ventas ?? []) {
    const fecha = new Date(venta.fechaConfirmacion);

    if (
      !Number.isNaN(fecha.getTime()) &&
      fecha.getUTCFullYear() === anio
    ) {
      meses[fecha.getUTCMonth()] += Number(
        venta.subtotalLinea
      );
    }
  }

  const maximo = Math.max(...meses, 1);

  const totalAnual = ventas?.totalIngresos ?? 0;

  const ventasMesActual =
    anio === anioActual
      ? meses[new Date().getMonth()]
      : 0;

  // ----------------------------------------
  // CALCULAR INDICADORES DE INVENTARIO
  // ----------------------------------------

  const inventario = inventarioEstado.datos;

  const productosBajos =
    inventario?.productos.filter(
      (producto) =>
        producto.activo &&
        Number(producto.existencias) <=
          UMBRAL_INVENTARIO_BAJO
    ) ?? [];

  // ----------------------------------------
  // CALCULAR INDICADORES DE ACADEMIA
  // ----------------------------------------

  const academia = academiaEstado.datos;

  const ocupacion = Number(
    academia?.porcentajeOcupacion ?? 0
  );

  // ----------------------------------------
  // CALCULAR PEDIDOS ACTIVOS
  // ----------------------------------------

  const pedidos = pedidosEstado.datos?.pedidos ?? [];

  const activos = pedidos.filter((pedido) => {
    if (pedido.modalidadEntrega === "ENVIO") {
      return pedido.estadoOperativo !== "ENVIADO";
    }

    return pedido.estadoOperativo !== "RETIRADO";
  });

  const listos = activos.filter(
    (pedido) =>
      pedido.estadoOperativo === "LISTO_RETIRO"
  ).length;

  // ----------------------------------------
  // CONSTRUIR ACTIVIDAD RECIENTE REAL
  // ----------------------------------------

  const actividad = [
    ...pedidos.map((pedido) => ({
      fecha: pedido.fechaCreacion,
      texto: `Pedido N.º ${pedido.idPedido} registrado`,
    })),

    ...(pedidosEstado.datos?.cambios ?? []).map(
      (cambio) => ({
        fecha: cambio.fechaCambio,
        texto: `Pedido N.º ${cambio.idPedido} pasó a ${
          ETIQUETAS_ESTADO[cambio.estadoNuevo] ??
          cambio.estadoNuevo
        }`,
      })
    ),

    ...(ventas?.ventas ?? []).map((venta) => ({
      fecha: venta.fechaConfirmacion,
      texto: `Pedido N.º ${venta.idPedido} confirmado`,
    })),
  ]
    .filter(
      (elemento, indice, conjunto) =>
        conjunto.findIndex(
          (otro) =>
            otro.texto === elemento.texto &&
            otro.fecha === elemento.fecha
        ) === indice
    )
    .sort(
      (a, b) =>
        new Date(b.fecha).getTime() -
        new Date(a.fecha).getTime()
    )
    .slice(0, 5);

  // ----------------------------------------
  // INTERFAZ DEL ADMINISTRADOR
  // ----------------------------------------

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>
          Administración
        </Sobretitulo>

        <h1 className="mt-3 font-serif text-5xl">
          El pulso de{" "}
          <em className="text-naranja">
            Intervallum
          </em>
        </h1>

        <p className="mt-2 text-gris">
          Visión general de ventas, inventario y academia
          con información registrada.
        </p>
      </div>

      {/* INDICADORES PRINCIPALES */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Indicador
          titulo="Ventas del mes"
          valor={valorCarga(
            ventasEstado,
            formatearColones(ventasMesActual)
          )}
          detalle={
            ventasEstado.error ??
            "Ingresos por ventas confirmadas"
          }
        />

        <Indicador
          titulo="Pedidos activos"
          valor={valorCarga(
            pedidosEstado,
            String(activos.length)
          )}
          detalle={
            pedidosEstado.error ??
            `${listos} ${
              listos === 1 ? "listo" : "listos"
            } para retiro`
          }
        />

        <Indicador
          titulo="Inventario bajo"
          valor={valorCarga(
            inventarioEstado,
            String(productosBajos.length)
          )}
          detalle={
            inventarioEstado.error ??
            `${UMBRAL_INVENTARIO_BAJO} unidades o menos`
          }
        />

        <Indicador
          titulo="Ocupación academia"
          valor={valorCarga(
            academiaEstado,
            `${ocupacion}%`
          )}
          detalle={
            academiaEstado.error ??
            "Ocupación de cursos registrados"
          }
        />
      </div>

      {/* GRÁFICO DE VENTAS Y ACTIVIDAD */}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="border border-borde bg-papel p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Sobretitulo>
                Reporte de ventas
              </Sobretitulo>

              <h2 className="mt-2 font-serif text-3xl">
                Ventas {anio}
              </h2>

              <p className="mt-2 font-serif text-3xl">
                {valorCarga(
                  ventasEstado,
                  formatearColones(totalAnual)
                )}

                <span className="font-sans text-xs text-gris">
                  {" "}acumulado
                </span>
              </p>
            </div>

            <select
              value={anio}
              onChange={(evento) =>
                setAnio(Number(evento.target.value))
              }
              className="border border-borde bg-white px-3 py-2 text-sm"
              aria-label="Año del reporte"
            >
              {anios.map((valor) => (
                <option
                  key={valor}
                  value={valor}
                >
                  {valor}
                </option>
              ))}
            </select>
          </div>

          {ventasEstado.error && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700"
            >
              {ventasEstado.error}
            </p>
          )}

          <div className="mt-8 flex h-48 items-end gap-3 border-b border-borde">
            {meses.map((monto, indice) => (
              <div
                key={indice}
                className="flex h-full flex-1 flex-col items-center justify-end"
                title={formatearColones(monto)}
              >
                <div
                  className="w-full bg-cafe"
                  style={{
                    height: `${
                      (monto / maximo) * 100
                    }%`,
                    minHeight: monto ? 4 : 0,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-3 text-center text-xs text-gris">
            {MESES.map((mes, indice) => (
              <span
                key={indice}
                className="flex-1"
              >
                {mes}
              </span>
            ))}
          </div>
        </section>

        {/* ACTIVIDAD RECIENTE */}

        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>
            Actividad reciente
          </Sobretitulo>

          <h2 className="mt-2 font-serif text-3xl">
            Últimos movimientos
          </h2>

          {pedidosEstado.cargando ? (
            <p className="mt-4 text-sm text-gris">
              Cargando...
            </p>
          ) : pedidosEstado.error ? (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700"
            >
              {pedidosEstado.error}
            </p>
          ) : actividad.length === 0 ? (
            <p className="mt-4 text-sm text-gris">
              Sin movimientos recientes.
            </p>
          ) : (
            <ul className="mt-4">
              {actividad.map((elemento, indice) => (
                <li
                  key={indice}
                  className="flex gap-3 border-b border-borde py-3 text-sm"
                >
                  <span className="w-20 shrink-0 text-xs text-gris">
                    {elemento.fecha.slice(0, 10)}
                  </span>

                  <span>
                    {elemento.texto}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* REPORTES DE INVENTARIO Y ACADEMIA */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* TABLA REAL DE INVENTARIO */}

        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>
            Reporte de existencias
          </Sobretitulo>

          {inventarioEstado.cargando ? (
            <p className="mt-4 text-sm text-gris">
              Cargando...
            </p>
          ) : inventarioEstado.error ? (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700"
            >
              {inventarioEstado.error}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="mt-4 w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-gris">
                  <tr>
                    <th className="pb-2 font-medium">
                      Producto
                    </th>

                    <th className="pb-2 font-medium">
                      Categoría
                    </th>

                    <th className="pb-2 text-right font-medium">
                      Existencias
                    </th>

                    <th className="pb-2 text-right font-medium">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(inventario?.productos ?? []).map(
                    (producto) => (
                      <tr
                        key={producto.idProducto}
                        className="border-t border-borde"
                      >
                        <td className="py-3">
                          {producto.nombre}
                        </td>

                        <td className="py-3 text-gris">
                          {producto.categoria}
                        </td>

                        <td className="py-3 text-right">
                          {producto.existencias}
                        </td>

                        <td className="py-3 text-right">
                          {!producto.activo ? (
                            <Insignia>
                              Inactivo
                            </Insignia>
                          ) : Number(
                              producto.existencias
                            ) === 0 ? (
                            <Insignia>
                              Agotado
                            </Insignia>
                          ) : Number(
                              producto.existencias
                            ) <=
                            UMBRAL_INVENTARIO_BAJO ? (
                            <Insignia>
                              Bajo
                            </Insignia>
                          ) : (
                            <span className="text-gris">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              {inventario?.productos.length === 0 && (
                <p className="mt-4 text-sm text-gris">
                  No hay productos registrados.
                </p>
              )}
            </div>
          )}
        </section>

        {/* TABLA REAL DE ACADEMIA */}

        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>
            Reporte de academia
          </Sobretitulo>

          {academiaEstado.cargando ? (
            <p className="mt-4 text-sm text-gris">
              Cargando...
            </p>
          ) : academiaEstado.error ? (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700"
            >
              {academiaEstado.error}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="mt-4 w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-gris">
                  <tr>
                    <th className="pb-2 font-medium">
                      Curso
                    </th>

                    <th className="pb-2 font-medium">
                      Estado
                    </th>

                    <th className="pb-2 text-right font-medium">
                      Inscritos
                    </th>

                    <th className="pb-2 text-right font-medium">
                      Ocupación
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(academia?.cursos ?? []).map(
                    (curso) => {
                      const inscritos = Number(
                        curso.inscritosConfirmados
                      );

                      const cupo = Number(
                        curso.cupoMaximo
                      );

                      const porcentaje =
                        cupo > 0
                          ? Math.round(
                              (inscritos / cupo) * 100
                            )
                          : 0;

                      return (
                        <tr
                          key={curso.idCurso}
                          className="border-t border-borde"
                        >
                          <td className="py-3">
                            {curso.curso}
                          </td>

                          <td className="py-3 text-gris">
                            {curso.estado}
                          </td>

                          <td className="py-3 text-right">
                            {inscritos} / {cupo}
                          </td>

                          <td className="py-3 text-right">
                            {porcentaje}%
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>

              {academia?.cursos.length === 0 && (
                <p className="mt-4 text-sm text-gris">
                  No hay cursos registrados.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ----------------------------------------
// COMPONENTE REUTILIZABLE DE INDICADORES
// ----------------------------------------

function Indicador({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: string;
  detalle: string;
}) {
  return (
    <div className="border border-borde bg-papel p-6">
      <p className="text-sm text-gris">
        {titulo}
      </p>

      <p className="mt-3 font-serif text-4xl">
        {valor}
      </p>

      <p className="mt-2 text-xs text-gris">
        {detalle}
      </p>
    </div>
  );
}
