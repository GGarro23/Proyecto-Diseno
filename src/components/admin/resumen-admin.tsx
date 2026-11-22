"use client";

import { useEffect, useState } from "react";

import { useInscripciones } from "@/components/academia/inscripciones";
import { usePedidosReales } from "@/components/pedidos/pedidos";
import { Insignia, Sobretitulo } from "@/components/ui/textos";

import { formatearColones } from "@/lib/formato";

import {
  apiReporteAcademia,
  apiReporteInventario,
  apiReporteVentas,
  type ReporteAcademia,
  type ReporteInventario,
  type ReporteVentas,
} from "@/lib/api-reportes";

import { UMBRAL_INVENTARIO_BAJO } from "@/modules/catalogo-inventario/reglas";

import { MESES } from "@/modules/reportes/reportes";

const NOMBRES_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "En preparación",
  EMPACADO: "Empacado",
  ENVIADO: "Enviado",
  LISTO_RETIRO: "Listo para retiro",
  RETIRADO: "Retirado",
};

function instante(fecha: string): number {
  const normalizada = fecha
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00");

  const valor = new Date(normalizada).getTime();

  return Number.isNaN(valor) ? 0 : valor;
}

function fechaLocal(milisegundos: number): string {
  const fecha = new Date(milisegundos);
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function estadoCurso(estado: string): string {
  return estado === "ABIERTO" ? "Abierto" : estado === "CERRADO" ? "Cerrado" : estado;
}

export function ResumenAdmin() {
  const { pedidos, historial, cargando: cargandoPedidos, error: errorPedidos } =
    usePedidosReales();
  const inscripciones = useInscripciones();

  const anioActual = new Date().getFullYear();

  const anios = [
    anioActual,
    anioActual - 1,
    anioActual - 2,
  ];

  const [anio, setAnio] = useState(anioActual);

  const [reporteVentas, setReporteVentas] = useState<{
    anio: number;
    datos: ReporteVentas | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarReporte() {
      const resultado = await apiReporteVentas(
        `${anio}-01-01`,
        `${anio}-12-31`
      );

      if (cancelado) return;

      setReporteVentas(
        resultado.ok
          ? { anio, datos: resultado.dato, error: null }
          : { anio, datos: null, error: resultado.error }
      );
    }

    void cargarReporte();

    return () => {
      cancelado = true;
    };
  }, [anio]);

  const cargandoVentas = reporteVentas?.anio !== anio;
  const ventas = cargandoVentas ? null : reporteVentas.datos;
  const errorVentas = cargandoVentas ? null : reporteVentas.error;

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
        meses[fecha.getMonth()] += Number(
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

  const [reportes, setReportes] = useState<{
    inventario: ReporteInventario | null;
    errorInventario: string | null;
    academia: ReporteAcademia | null;
    errorAcademia: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarReportes() {
      const [inventario, academia] = await Promise.all([
        apiReporteInventario(),
        apiReporteAcademia(),
      ]);

      if (cancelado) return;

      setReportes({
        inventario: inventario.ok ? inventario.dato : null,
        errorInventario: inventario.ok ? null : inventario.error,
        academia: academia.ok ? academia.dato : null,
        errorAcademia: academia.ok ? null : academia.error,
      });
    }

    void cargarReportes();

    return () => {
      cancelado = true;
    };
  }, []);

  const cargandoReportes = reportes === null;
  const productosReporte = reportes?.inventario?.productos ?? [];
  const cursosReporte = reportes?.academia?.cursos ?? [];

  const productosBajos = productosReporte.filter(
    (producto) =>
      producto.activo &&
      Number(producto.existencias) <=
        UMBRAL_INVENTARIO_BAJO
  );

  const cursosAbiertos = cursosReporte.filter(
    (curso) => curso.estado === "ABIERTO"
  );

  const cuposAbiertos = cursosAbiertos.reduce(
    (suma, curso) => suma + Number(curso.cupoMaximo),
    0
  );

  const inscritosAbiertos = cursosAbiertos.reduce(
    (suma, curso) => suma + Number(curso.inscritosConfirmados),
    0
  );

  const ocupacionAcademia = cuposAbiertos
    ? Math.round((inscritosAbiertos / cuposAbiertos) * 100)
    : 0;

  const activos = pedidos.filter(
    (pedido) =>
      pedido.estadoPago === "CONFIRMADO" &&
      pedido.estadoOperativo !== "ENVIADO" &&
      pedido.estadoOperativo !== "RETIRADO"
  );

  const listos = activos.filter(
    (pedido) =>
      pedido.estadoOperativo === "LISTO_RETIRO"
  ).length;

  const nombreCurso = (idCurso: number) =>
    cursosReporte.find((curso) => curso.idCurso === idCurso)?.curso ?? "un curso";

  const actividad = [
    ...pedidos.map((pedido) => ({
      fecha: instante(pedido.fechaCreacion),
      texto: `Pedido N.º ${pedido.idPedido} registrado`,
    })),

    ...historial.map((cambio) => ({
      fecha: instante(cambio.fechaCambio),
      texto: `Pedido N.º ${cambio.idPedido} pasó a ${
        NOMBRES_ESTADO[cambio.estadoNuevo] ?? cambio.estadoNuevo
      }`,
    })),

    ...inscripciones.map((inscripcion) => ({
      fecha: instante(inscripcion.fechaInscripcion),
      texto: `Nueva inscripción en ${nombreCurso(inscripcion.idCurso)}`,
    })),
  ]
    .sort((a, b) => b.fecha - a.fecha)
    .slice(0, 5);

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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Indicador
          titulo="Ventas del mes"
          valor={
            cargandoVentas
              ? "Cargando..."
              : errorVentas
                ? "No disponible"
                : formatearColones(ventasMesActual)
          }
          detalle={
            errorVentas ??
            "Ingresos por ventas confirmadas"
          }
        />

        <Indicador
          titulo="Pedidos activos"
          valor={
            cargandoPedidos
              ? "Cargando..."
              : errorPedidos
                ? "No disponible"
                : String(activos.length)
          }
          detalle={
            errorPedidos ??
            `${listos} ${listos === 1 ? "listo" : "listos"} para retiro`
          }
        />

        <Indicador
          titulo="Inventario bajo"
          valor={
            cargandoReportes
              ? "Cargando..."
              : reportes.errorInventario
                ? "No disponible"
                : String(productosBajos.length)
          }
          detalle={
            reportes?.errorInventario ??
            `${UMBRAL_INVENTARIO_BAJO} unidades o menos`
          }
        />

        <Indicador
          titulo="Ocupación academia"
          valor={
            cargandoReportes
              ? "Cargando..."
              : reportes.errorAcademia
                ? "No disponible"
                : `${ocupacionAcademia}%`
          }
          detalle={
            reportes?.errorAcademia ??
            "Cursos abiertos"
          }
        />
      </div>

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

          {actividad.length === 0 ? (
            <p className="mt-4 text-sm text-gris">
              {cargandoPedidos ? "Cargando..." : "Sin actividad registrada."}
            </p>
          ) : (
            <ul className="mt-4">
              {actividad.map((elemento, indice) => (
                <li
                  key={indice}
                  className="flex gap-3 border-b border-borde py-3 text-sm"
                >
                  <span className="w-20 shrink-0 text-xs text-gris">
                    {fechaLocal(elemento.fecha)}
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

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>
            Reporte de existencias
          </Sobretitulo>

          {reportes?.errorInventario && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {reportes.errorInventario}
            </p>
          )}

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
              {productosReporte.map((producto) => (
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
                      <Insignia>Inactivo</Insignia>
                    ) : Number(producto.existencias) === 0 ? (
                      <Insignia>Agotado</Insignia>
                    ) : Number(producto.existencias) <= UMBRAL_INVENTARIO_BAJO ? (
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

          {reportes?.errorAcademia && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {reportes.errorAcademia}
            </p>
          )}

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
              {cursosReporte.map((curso) => (
                <tr
                  key={curso.idCurso}
                  className="border-t border-borde"
                >
                  <td className="py-3">
                    {curso.curso}
                  </td>

                  <td className="py-3 text-gris">
                    {estadoCurso(curso.estado)}
                  </td>

                  <td className="py-3 text-right">
                    {curso.inscritosConfirmados} / {curso.cupoMaximo}
                  </td>

                  <td className="py-3 text-right">
                    {curso.cupoMaximo
                      ? Math.round((Number(curso.inscritosConfirmados) / Number(curso.cupoMaximo)) * 100)
                      : 0}%
                  </td>
                </tr>
              ))}
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
