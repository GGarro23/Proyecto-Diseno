
"use client";

import { useCallback, useState } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Icono } from "@/components/ui/icono";
import {
  Insignia,
  Sobretitulo,
} from "@/components/ui/textos";

import { formatearColones, formatearFecha, formatearFechaHora } from "@/lib/formato";

import {
  apiCambiarEstadoPedido,
  type EstadoOperativoPedido,
  type ModalidadPedido,
} from "@/lib/api-pedidos";

import type { Sesion } from "@/modules/autenticacion-usuarios/schema";

import {
  usePedidosReales,
  type PedidoPanel,
} from "./pedidos";

const VISTAS = [
  "Vista Kanban",
  "Lista de pedidos",
  "Historial",
] as const;

const COLUMNAS: EstadoOperativoPedido[] = [
  "PENDIENTE",
  "EN_PREPARACION",
  "EMPACADO",
  "LISTO_RETIRO",
];

function nombreEstado(estado: string) {
  const nombres: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En preparación",
    EMPACADO: "Empacado",
    ENVIADO: "Enviado",
    LISTO_RETIRO: "Listo para retiro",
    RETIRADO: "Retirado",
  };

  return nombres[estado] ?? estado;
}

function nombreModalidad(modalidad: ModalidadPedido) {
  return modalidad === "ENVIO"
    ? "Envío a domicilio"
    : "Retiro presencial";
}

function siguienteEstadoPedido(
  modalidad: ModalidadPedido,
  estadoActual: EstadoOperativoPedido
): EstadoOperativoPedido | null {
  if (estadoActual === "PENDIENTE") {
    return "EN_PREPARACION";
  }

  if (modalidad === "ENVIO") {
    if (estadoActual === "EN_PREPARACION") {
      return "EMPACADO";
    }

    if (estadoActual === "EMPACADO") {
      return "ENVIADO";
    }
  }

  if (modalidad === "RETIRO") {
    if (estadoActual === "EN_PREPARACION") {
      return "LISTO_RETIRO";
    }

    if (estadoActual === "LISTO_RETIRO") {
      return "RETIRADO";
    }
  }

  return null;
}

function esEstadoFinalPedido(
  modalidad: ModalidadPedido,
  estado: EstadoOperativoPedido
) {
  return (
    (modalidad === "ENVIO" && estado === "ENVIADO") ||
    (modalidad === "RETIRO" && estado === "RETIRADO")
  );
}

export function PanelEncargado({
  sesion,
}: {
  sesion: Sesion;
}) {
  const {
    pedidos,
    historial,
    cargando,
    error,
    refrescar,
    moverPedido,
  } = usePedidosReales();

  const [vista, setVista] = useState<
    (typeof VISTAS)[number]
  >("Vista Kanban");

  const [aviso, setAviso] = useState<string | null>(
    null
  );

  const [actualizando, setActualizando] = useState<
    number | null
  >(null);

  const cerrarAviso = useCallback(
    () => setAviso(null),
    []
  );

  const puedeActualizar = sesion.roles.includes(
    "Encargado de pedidos"
  );

  const confirmados = pedidos.filter(
    (pedido) => pedido.estadoPago === "CONFIRMADO"
  );

  const activos = confirmados.filter(
    (pedido) =>
      !esEstadoFinalPedido(
        pedido.modalidadEntrega,
        pedido.estadoOperativo
      )
  );

  const avanzar = async (pedido: PedidoPanel) => {
    if (!puedeActualizar || actualizando !== null) {
      return;
    }

    const estadoNuevo = siguienteEstadoPedido(
      pedido.modalidadEntrega,
      pedido.estadoOperativo
    );

    if (!estadoNuevo) {
      setAviso(
        "El pedido ya se encuentra en su estado final."
      );
      return;
    }

    setActualizando(pedido.idPedido);

    try {
      const resultado = await apiCambiarEstadoPedido(
        pedido.idPedido,
        estadoNuevo
      );

      if (!resultado.ok) {
        setAviso(resultado.error);
        return;
      }

      moverPedido(pedido.idPedido, estadoNuevo);

      setAviso(
        `Pedido N.º ${pedido.idPedido} actualizado a ${nombreEstado(estadoNuevo)}.`
      );

      void refrescar(true);
    } catch {
      setAviso(
        "No fue posible actualizar el pedido. Consulta su estado antes de reintentarlo."
      );
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>
          Centro de operaciones
        </Sobretitulo>

        <h1 className="mt-3 font-serif text-5xl">
          Pedidos en{" "}
          <em className="text-naranja">
            movimiento
          </em>
        </h1>

        <p className="mt-2 text-gris">
          {activos.length}{" "}
          {activos.length === 1
            ? "pedido activo"
            : "pedidos activos"}{" "}
          · {confirmados.length} confirmados en total
        </p>
      </div>

      {cargando && (
        <p className="text-sm text-gris">
          Consultando pedidos...
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="border border-borde bg-papel p-5"
        >
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void refrescar()}
            className="mt-3 text-sm text-naranja underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && (
        <>
          <div className="flex gap-2">
            {VISTAS.map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => setVista(opcion)}
                className={`border px-4 py-2 text-sm ${
                  opcion === vista
                    ? "border-cafe bg-cafe text-papel"
                    : "border-borde bg-papel hover:border-cafe"
                }`}
              >
                {opcion}
              </button>
            ))}
          </div>

          {vista === "Vista Kanban" && (
            <div className="grid gap-4 lg:grid-cols-4">
              {COLUMNAS.map((estado) => {
                const enColumna = activos.filter(
                  (pedido) =>
                    pedido.estadoOperativo === estado
                );

                return (
                  <section
                    key={estado}
                    className="flex min-h-96 flex-col gap-3 bg-naranja-claro/50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-xl">
                        {nombreEstado(estado)}
                      </h2>

                      <span className="flex size-6 items-center justify-center rounded-full bg-borde text-xs">
                        {enColumna.length}
                      </span>
                    </div>

                    {enColumna.map((pedido) => {
                      const siguiente =
                        siguienteEstadoPedido(
                          pedido.modalidadEntrega,
                          pedido.estadoOperativo
                        );

                      return (
                        <article
                          key={pedido.idPedido}
                          className="flex flex-col gap-3 border border-borde bg-papel p-4"
                        >
                          <div className="flex items-center justify-between">
                            <Insignia>
                              {pedido.modalidadEntrega ===
                              "ENVIO"
                                ? "Envío"
                                : "Retiro"}
                            </Insignia>

                            <span className="text-xs text-gris">
                              N.º {pedido.idPedido}
                            </span>
                          </div>

                          <h3 className="font-serif text-xl">
                            Cliente N.º {pedido.idUsuario}
                          </h3>

                          <p className="text-sm font-medium">
                            {formatearColones(
                              Number(pedido.total)
                            )}
                          </p>

                          {puedeActualizar && siguiente && (
                            <button
                              type="button"
                              disabled={
                                actualizando !== null
                              }
                              onClick={() =>
                                void avanzar(pedido)
                              }
                              className="flex items-center justify-between border-t border-borde pt-3 text-xs text-gris hover:text-naranja disabled:opacity-50"
                            >
                              <span>
                                {actualizando ===
                                pedido.idPedido
                                  ? "Actualizando..."
                                  : `Avanzar a ${nombreEstado(siguiente)}`}
                              </span>

                              <Icono nombre="flecha" />
                            </button>
                          )}
                        </article>
                      );
                    })}
                  </section>
                );
              })}
            </div>
          )}

          {vista === "Lista de pedidos" && (
            <Tabla
              encabezados={[
                "Pedido",
                "Cliente",
                "Fecha",
                "Modalidad",
                "Dirección",
                "Total",
                "Estado",
              ]}
              filas={confirmados.map((pedido) => [
                `N.º ${pedido.idPedido}`,
                `Cliente N.º ${pedido.idUsuario}`,
                formatearFecha(pedido.fechaCreacion),
                nombreModalidad(
                  pedido.modalidadEntrega
                ),
                pedido.direccionEntrega ?? "—",
                formatearColones(
                  Number(pedido.total)
                ),
                nombreEstado(
                  pedido.estadoOperativo
                ),
              ])}
              vacio="No hay pedidos confirmados."
            />
          )}

          {vista === "Historial" && (
            <Tabla
              encabezados={[
                "Fecha",
                "Pedido",
                "Estado anterior",
                "Estado nuevo",
                "Responsable",
              ]}
              filas={historial.map((cambio) => [
                formatearFechaHora(cambio.fechaCambio),
                `N.º ${cambio.idPedido}`,
                nombreEstado(
                  cambio.estadoAnterior
                ),
                nombreEstado(
                  cambio.estadoNuevo
                ),
                `Usuario N.º ${cambio.idResponsable}`,
              ])}
              vacio="Todavía no hay cambios de estado registrados."
            />
          )}
        </>
      )}

      <Aviso
        texto={aviso}
        alCerrar={cerrarAviso}
      />
    </div>
  );
}

function Tabla({
  encabezados,
  filas,
  vacio,
}: {
  encabezados: string[];
  filas: string[][];
  vacio: string;
}) {
  if (filas.length === 0) {
    return (
      <p className="border border-borde bg-papel p-10 text-center text-gris">
        {vacio}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-borde bg-papel">
      <table className="w-full text-sm">
        <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
          <tr>
            {encabezados.map((encabezado) => (
              <th
                key={encabezado}
                className="px-5 py-3 font-medium"
              >
                {encabezado}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filas.map((fila, indice) => (
            <tr
              key={indice}
              className="border-t border-borde"
            >
              {fila.map((celda, columna) => (
                <td
                  key={columna}
                  className="px-5 py-4"
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
