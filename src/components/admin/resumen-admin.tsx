
"use client";

import { useEffect, useState } from "react";

import { useInscripciones } from "@/components/academia/inscripciones";
import { usePedidos } from "@/components/pedidos/pedidos";
import { Insignia, Sobretitulo } from "@/components/ui/textos";

import { formatearColones } from "@/lib/formato";

import {
  apiReporteVentas,
  apiReporteInventario,
  type ReporteVentas,
  type ReporteInventario,
} from "@/lib/api-reportes";

import { categorias } from "@/mocks/categorias";
import { cursos } from "@/mocks/cursos";
import { productos } from "@/mocks/productos";

import {
  tieneInventarioBajo,
  UMBRAL_INVENTARIO_BAJO,
} from "@/modules/catalogo-inventario/reglas";

import { esEstadoFinal } from "@/modules/gestion-pedidos/transiciones";

import {
  MESES,
  ocupacionAcademia,
  ocupacionCurso,
  pedidosConfirmados,
} from "@/modules/reportes/reportes";

// Panel general y reportes del Administrador (Figura 31, RF-44).
export function ResumenAdmin() {
  // Datos simulados que todavía utilizan otras secciones.
  const { pedidos, historial } = usePedidos();
  const inscripciones = useInscripciones();

  const confirmados = pedidosConfirmados(pedidos);

  // -----------------------------------------
  // REPORTE DE VENTAS REAL
  // -----------------------------------------

  const anioActual = new Date().getFullYear();

  const anios = [
    anioActual,
    anioActual - 1,
    anioActual - 2,
  ];

  const [anio, setAnio] = useState(anioActual);

  const [reporteVentas, setReporteVentas] = useState<{
    anio: number;
    datos: ReporteVentas;
  } | null>(null);

  const [cargandoVentas, setCargandoVentas] =
    useState(true);

  const [errorVentas, setErrorVentas] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarReporte() {
      await Promise.resolve();

      if (cancelado) return;

      setCargandoVentas(true);
      setErrorVentas(null);

      const fechaInicio = `${anio}-01-01`;
      const fechaFin = `${anio}-12-31`;

      try {
        const resultado = await apiReporteVentas(
          fechaInicio,
          fechaFin
        );

        if (cancelado) return;

        if (!resultado.ok) {
          setErrorVentas(resultado.error);
          return;
        }

        setReporteVentas({
          anio,
          datos: resultado.dato,
        });
      } catch {
        if (!cancelado) {
          setErrorVentas(
            "No fue posible consultar el reporte de ventas."
          );
        }
      } finally {
        if (!cancelado) {
          setCargandoVentas(false);
        }
      }
    }

    void cargarReporte();

    return () => {
      cancelado = true;
    };
  }, [anio]);

  // No mostrar datos de otro año durante la carga.
  const ventas =
    reporteVentas?.anio === anio
      ? reporteVentas.datos
      : null;

  const meses = Array.from(
    { length: 12 },
    () => 0
  );

  if (ventas) {
    for (const venta of ventas.ventas) {
      const fecha = new Date(
        venta.fechaConfirmacion
      );

      if (!Number.isNaN(fecha.getTime())) {
        const mes = fecha.getUTCMonth();

        meses[mes] += Number(
          venta.subtotalLinea
        );
      }
    }
  }

  const maximo = Math.max(...meses, 1);

  const totalAnual =
    ventas?.totalIngresos ?? 0;

  const mesActual = new Date().getMonth();

  const ventasMesActual =
    anio === anioActual
      ? meses[mesActual]
      : 0;

  // -----------------------------------------
  // REPORTE DE INVENTARIO REAL
  // -----------------------------------------

  const [reporteInventario, setReporteInventario] =
    useState<ReporteInventario | null>(null);

  const [cargandoInventario, setCargandoInventario] =
    useState(true);

  const [errorInventario, setErrorInventario] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarInventario() {
      await Promise.resolve();

      if (cancelado) return;

      setCargandoInventario(true);
      setErrorInventario(null);

      try {
        const resultado =
          await apiReporteInventario();

        if (cancelado) return;

        if (!resultado.ok) {
          setErrorInventario(resultado.error);
          return;
        }

        setReporteInventario(resultado.dato);
      } catch {
        if (!cancelado) {
          setErrorInventario(
            "No fue posible consultar el inventario."
          );
        }
      } finally {
        if (!cancelado) {
          setCargandoInventario(false);
        }
      }
    }

    void cargarInventario();

    return () => {
      cancelado = true;
    };
  }, []);

  const productosBajosReales =
    reporteInventario?.productos.filter(
      (producto) =>
        producto.activo &&
        Number(producto.existencias) <=
          UMBRAL_INVENTARIO_BAJO
    ) ?? [];

  // -----------------------------------------
  // DATOS PENDIENTES DE INTEGRACIÓN
  // -----------------------------------------

  // Estas variables todavía utilizan pedidos simulados.
  const activos = confirmados.filter(
    (pedido) =>
      !esEstadoFinal(
        pedido.modalidadEntrega,
        pedido.estadoOperativo
      )
  );

  const listos = activos.filter(
    (pedido) =>
      pedido.estadoOperativo === "Listo para retiro"
  ).length;

  const actividad = [
    ...confirmados.map((pedido) => ({
      fecha: pedido.fechaConfirmacion!,
      texto: `Pedido N.º ${pedido.idPedido} confirmado`,
    })),

    ...historial.map((cambio) => ({
      fecha: cambio.fechaCambio,
      texto: `Pedido N.º ${cambio.idPedido} pasó a ${cambio.estadoNuevo}`,
    })),

    ...inscripciones.map((inscripcion) => ({
      fecha: inscripcion.fechaInscripcion,
      texto: `Nueva inscripción en ${
        cursos.find(
          (curso) =>
            curso.idCurso === inscripcion.idCurso
        )?.nombre ?? "un curso"
      }`,
    })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  // -----------------------------------------
  // INTERFAZ
  // -----------------------------------------

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
          Visión general de ventas, inventario y academia.
        </p>
      </div>

      {/* INDICADORES */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Indicador
          titulo="Ventas del mes"
          valor={
            cargandoVentas || !ventas
              ? errorVentas
                ? "No disponible"
                : "Cargando..."
              : formatearColones(ventasMesActual)
          }
          detalle={
            errorVentas ??
            "Ingresos por ventas confirmadas"
          }
        />

        <Indicador
          titulo="Pedidos activos"
          valor={String(activos.length)}
          detalle={`${listos} ${
            listos === 1 ? "listo" : "listos"
          } para retiro (datos de demostración)`}
        />

        <Indicador
          titulo="Inventario bajo"
          valor={
            cargandoInventario
              ? "Cargando..."
              : errorInventario
                ? "No disponible"
                : String(productosBajosReales.length)
          }
          detalle={
            errorInventario ??
            `${UMBRAL_INVENTARIO_BAJO} unidades o menos`
          }
        />

        <Indicador
          titulo="Ocupación academia"
          valor={`${ocupacionAcademia(
            cursos,
            inscripciones
          )}%`}
          detalle="Cursos abiertos (datos de demostración)"
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
                {cargandoVentas
                  ? "Cargando..."
                  : errorVentas
                    ? "No disponible"
                    : formatearColones(totalAnual)}

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

          {errorVentas && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700"
            >
              {errorVentas}
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

        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>
            Actividad reciente
          </Sobretitulo>

          <h2 className="mt-2 font-serif text-3xl">
            Últimos movimientos
          </h2>

          <p className="mt-1 text-xs text-gris">
            Datos de demostración
          </p>

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
        </section>
      </div>

      {/* REPORTES DE INVENTARIO Y ACADEMIA */}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>
            Reporte de existencias
          </Sobretitulo>

          <p className="mt-1 text-xs text-gris">
            Tabla con datos de demostración
          </p>

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
              {productos.map((producto) => (
                <tr
                  key={producto.idProducto}
                  className="border-t border-borde"
                >
                  <td className="py-3">
                    {producto.nombre}
                  </td>

                  <td className="py-3 text-gris">
                    {categorias.find(
                      (categoria) =>
                        categoria.idCategoria ===
                        producto.idCategoria
                    )?.nombre}
                  </td>

                  <td className="py-3 text-right">
                    {producto.existencias}
                  </td>

                  <td className="py-3 text-right">
                    {!producto.activo ? (
                      <Insignia>Inactivo</Insignia>
                    ) : producto.existencias === 0 ? (
                      <Insignia>Agotado</Insignia>
                    ) : tieneInventarioBajo(producto) ? (
                      <Insignia>Bajo</Insignia>
                    ) : (
                      <span className="text-gris">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>
            Reporte de academia
          </Sobretitulo>

          <p className="mt-1 text-xs text-gris">
            Datos de demostración
          </p>

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
              {cursos.map((curso) => {
                const {
                  inscritos,
                  porcentaje,
                } = ocupacionCurso(
                  curso,
                  inscripciones
                );

                return (
                  <tr
                    key={curso.idCurso}
                    className="border-t border-borde"
                  >
                    <td className="py-3">
                      {curso.nombre}
                    </td>

                    <td className="py-3 text-gris">
                      {curso.estado}
                    </td>

                    <td className="py-3 text-right">
                      {inscritos} / {curso.cupoMaximo}
                    </td>

                    <td className="py-3 text-right">
                      {porcentaje}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

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
