"use client";

import { useCallback, useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Icono } from "@/components/ui/icono";
import { Insignia, Sobretitulo } from "@/components/ui/textos";
import { formatearColones } from "@/lib/formato";
import { nombreDeUsuario } from "@/mocks/auth";
import { avanzarEstadoPedido, type PedidoConDetalle } from "@/mocks/compra-simulada";
import { esEstadoFinal, siguienteEstado } from "@/modules/gestion-pedidos/transiciones";
import type { Sesion } from "@/modules/autenticacion-usuarios/schema";
import type { EstadoOperativo } from "@/modules/ventas-pagos/schema";
import { usePedidos } from "./use-pedidos";

const VISTAS = ["Vista Kanban", "Lista de pedidos", "Historial"] as const;
const COLUMNAS: EstadoOperativo[] = ["Pendiente", "En preparación", "Empacado", "Listo para retiro"];

// Panel de gestión de pedidos (Figuras 28 y 29, RF-27, RF-28)
export function PanelPedidos({ sesion }: { sesion: Sesion }) {
  const { pedidos, historial } = usePedidos();
  const [vista, setVista] = useState<(typeof VISTAS)[number]>("Vista Kanban");
  const [aviso, setAviso] = useState<string | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);
  const puedeActualizar = sesion.roles.includes("Encargado de pedidos"); // RF-28

  // Solo pedidos confirmados (pago aprobado) entran a la gestión operativa
  const confirmados = pedidos.filter((p) => p.estadoPago === "Aprobado");
  const activos = confirmados.filter((p) => !esEstadoFinal(p.modalidadEntrega, p.estadoOperativo));

  const avanzar = (p: PedidoConDetalle) => {
    const resultado = avanzarEstadoPedido(p.idPedido, sesion.usuario.idUsuario);
    setAviso(resultado.ok ? `Pedido N.º ${p.idPedido} avanzó a ${resultado.dato.estadoOperativo}` : resultado.error);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>Centro de operaciones</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          Pedidos en <em className="text-naranja">movimiento</em>
        </h1>
        <p className="mt-2 text-gris">
          {activos.length} {activos.length === 1 ? "pedido activo" : "pedidos activos"} · {confirmados.length} confirmados en total
        </p>
      </div>

      <div className="flex gap-2">
        {VISTAS.map((v) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`border px-4 py-2 text-sm ${v === vista ? "border-cafe bg-cafe text-papel" : "border-borde bg-papel hover:border-cafe"}`}
          >
            {v}
          </button>
        ))}
      </div>

      {vista === "Vista Kanban" && (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNAS.map((estado) => {
            const enColumna = activos.filter((p) => p.estadoOperativo === estado);
            return (
              <section key={estado} className="flex min-h-96 flex-col gap-3 bg-naranja-claro/50 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl">{estado}</h2>
                  <span className="flex size-6 items-center justify-center rounded-full bg-borde text-xs">{enColumna.length}</span>
                </div>
                {enColumna.map((p) => (
                  <article key={p.idPedido} className="flex flex-col gap-3 border border-borde bg-papel p-4">
                    <div className="flex items-center justify-between">
                      <Insignia>{p.modalidadEntrega === "Envío a domicilio" ? "Envío" : "Retiro"}</Insignia>
                      <span className="text-xs text-gris">N.º {p.idPedido}</span>
                    </div>
                    <h3 className="font-serif text-xl">{nombreDeUsuario(p.idUsuario)}</h3>
                    <p className="text-sm font-medium">{formatearColones(p.total)}</p>
                    {puedeActualizar && (
                      <button
                        onClick={() => avanzar(p)}
                        className="flex items-center justify-between border-t border-borde pt-3 text-xs text-gris hover:text-naranja"
                      >
                        Avanzar a {siguienteEstado(p.modalidadEntrega, p.estadoOperativo)}
                        <Icono nombre="flecha" />
                      </button>
                    )}
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      )}

      {vista === "Lista de pedidos" && (
        <Tabla
          encabezados={["Pedido", "Cliente", "Fecha", "Modalidad", "Dirección", "Total", "Estado"]}
          filas={confirmados.map((p) => [
            `N.º ${p.idPedido}`,
            nombreDeUsuario(p.idUsuario),
            p.fechaCreacion.slice(0, 10),
            p.modalidadEntrega,
            p.direccionEntrega ?? "—",
            formatearColones(p.total),
            p.estadoOperativo,
          ])}
          vacio="No hay pedidos confirmados."
        />
      )}

      {vista === "Historial" && (
        <Tabla
          encabezados={["Fecha", "Pedido", "Estado anterior", "Estado nuevo", "Responsable"]}
          filas={[...historial]
            .sort((a, b) => b.fechaCambio.localeCompare(a.fechaCambio))
            .map((h) => [
              h.fechaCambio.slice(0, 16).replace("T", " "),
              `N.º ${h.idPedido}`,
              h.estadoAnterior,
              h.estadoNuevo,
              nombreDeUsuario(h.idResponsable),
            ])}
          vacio="Todavía no hay cambios de estado registrados."
        />
      )}

      <Aviso texto={aviso} alCerrar={cerrarAviso} />
    </div>
  );
}

function Tabla({ encabezados, filas, vacio }: { encabezados: string[]; filas: string[][]; vacio: string }) {
  if (filas.length === 0) return <p className="border border-borde bg-papel p-10 text-center text-gris">{vacio}</p>;
  return (
    <div className="overflow-x-auto border border-borde bg-papel">
      <table className="w-full text-sm">
        <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
          <tr>
            {encabezados.map((e) => (
              <th key={e} className="px-5 py-3 font-medium">{e}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="border-t border-borde">
              {fila.map((celda, j) => (
                <td key={j} className="px-5 py-4">{celda}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}