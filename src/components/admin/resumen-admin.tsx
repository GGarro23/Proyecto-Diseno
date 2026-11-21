"use client";

import { useState } from "react";
import { useInscripciones } from "@/components/academia/inscripciones";
import { usePedidos } from "@/components/pedidos/use-pedidos";
import { Insignia, Sobretitulo } from "@/components/ui/textos";
import { formatearColones } from "@/lib/formato";
import { categorias } from "@/mocks/categorias";
import { cursos } from "@/mocks/cursos";
import { productos } from "@/mocks/productos";
import { tieneInventarioBajo, UMBRAL_INVENTARIO_BAJO } from "@/modules/catalogo-inventario/reglas";
import { esEstadoFinal } from "@/modules/gestion-pedidos/transiciones";
import {
  MESES,
  ocupacionAcademia,
  ocupacionCurso,
  pedidosConfirmados,
  ventasDelMes,
  ventasPorMes,
} from "@/modules/reportes/reportes";

// Panel general y reportes del Administrador (Figura 31, RF-44)
export function ResumenAdmin() {
  const { pedidos, historial } = usePedidos();
  const inscripciones = useInscripciones();
  const confirmados = pedidosConfirmados(pedidos);

  // Filtro del reporte de ventas: año
  const anios = [...new Set([new Date().getFullYear(), ...confirmados.map((p) => new Date(p.fechaConfirmacion!).getFullYear())])].sort((a, b) => b - a);
  const [anio, setAnio] = useState(anios[0]);
  const meses = ventasPorMes(pedidos, anio);
  const maximo = Math.max(...meses, 1);

  const activos = confirmados.filter((p) => !esEstadoFinal(p.modalidadEntrega, p.estadoOperativo));
  const listos = activos.filter((p) => p.estadoOperativo === "Listo para retiro").length;
  const bajos = productos.filter(tieneInventarioBajo);

  // Actividad reciente: pedidos confirmados, cambios de estado e inscripciones
  const actividad = [
    ...confirmados.map((p) => ({ fecha: p.fechaConfirmacion!, texto: `Pedido N.º ${p.idPedido} confirmado` })),
    ...historial.map((h) => ({ fecha: h.fechaCambio, texto: `Pedido N.º ${h.idPedido} pasó a ${h.estadoNuevo}` })),
    ...inscripciones.map((i) => ({
      fecha: i.fechaInscripcion,
      texto: `Nueva inscripción en ${cursos.find((c) => c.idCurso === i.idCurso)?.nombre}`,
    })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>Administración</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          El pulso de <em className="text-naranja">Intervallum</em>
        </h1>
        <p className="mt-2 text-gris">Visión general de ventas, inventario y academia.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Indicador titulo="Ventas del mes" valor={formatearColones(ventasDelMes(pedidos))} detalle={`${confirmados.length} pedidos confirmados en total`} />
        <Indicador
          titulo="Pedidos activos"
          valor={String(activos.length)}
          detalle={`${listos} ${listos === 1 ? "listo" : "listos"} para retiro`}
        />
        <Indicador titulo="Inventario bajo" valor={String(bajos.length)} detalle={`${UMBRAL_INVENTARIO_BAJO} unidades o menos`} />
        <Indicador titulo="Ocupación academia" valor={`${ocupacionAcademia(cursos, inscripciones)}%`} detalle="Cursos abiertos" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="border border-borde bg-papel p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Sobretitulo>Reporte de ventas</Sobretitulo>
              <h2 className="mt-2 font-serif text-3xl">Ventas {anio}</h2>
              <p className="mt-2 font-serif text-3xl">
                {formatearColones(meses.reduce((a, b) => a + b, 0))} <span className="font-sans text-xs text-gris">acumulado</span>
              </p>
            </div>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="border border-borde bg-white px-3 py-2 text-sm"
              aria-label="Año del reporte"
            >
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="mt-8 flex h-48 items-end gap-3 border-b border-borde">
            {meses.map((monto, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end" title={formatearColones(monto)}>
                <div className="w-full bg-cafe" style={{ height: `${(monto / maximo) * 100}%`, minHeight: monto ? 4 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-center text-xs text-gris">
            {MESES.map((m, i) => (
              <span key={i} className="flex-1">{m}</span>
            ))}
          </div>
        </section>

        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>Actividad reciente</Sobretitulo>
          <h2 className="mt-2 font-serif text-3xl">Últimos movimientos</h2>
          <ul className="mt-4">
            {actividad.map((a, i) => (
              <li key={i} className="flex gap-3 border-b border-borde py-3 text-sm">
                <span className="w-20 shrink-0 text-xs text-gris">{a.fecha.slice(0, 10)}</span>
                <span>{a.texto}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>Reporte de existencias</Sobretitulo>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gris">
              <tr>
                <th className="pb-2 font-medium">Producto</th>
                <th className="pb-2 font-medium">Categoría</th>
                <th className="pb-2 text-right font-medium">Existencias</th>
                <th className="pb-2 text-right font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.idProducto} className="border-t border-borde">
                  <td className="py-3">{p.nombre}</td>
                  <td className="py-3 text-gris">{categorias.find((c) => c.idCategoria === p.idCategoria)?.nombre}</td>
                  <td className="py-3 text-right">{p.existencias}</td>
                  <td className="py-3 text-right">
                    {!p.activo ? <Insignia>Inactivo</Insignia> : p.existencias === 0 ? <Insignia>Agotado</Insignia> : tieneInventarioBajo(p) ? <Insignia>Bajo</Insignia> : <span className="text-gris">Normal</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border border-borde bg-papel p-7">
          <Sobretitulo>Reporte de academia</Sobretitulo>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gris">
              <tr>
                <th className="pb-2 font-medium">Curso</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 text-right font-medium">Inscritos</th>
                <th className="pb-2 text-right font-medium">Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((c) => {
                const { inscritos, porcentaje } = ocupacionCurso(c, inscripciones);
                return (
                  <tr key={c.idCurso} className="border-t border-borde">
                    <td className="py-3">{c.nombre}</td>
                    <td className="py-3 text-gris">{c.estado}</td>
                    <td className="py-3 text-right">{inscritos} / {c.cupoMaximo}</td>
                    <td className="py-3 text-right">{porcentaje}%</td>
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

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="border border-borde bg-papel p-6">
      <p className="text-sm text-gris">{titulo}</p>
      <p className="mt-3 font-serif text-4xl">{valor}</p>
      <p className="mt-2 text-xs text-gris">{detalle}</p>
    </div>
  );
}