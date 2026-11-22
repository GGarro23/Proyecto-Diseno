"use client";

import { useCallback, useState } from "react";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Modal } from "@/components/ui/modal";
import { PanelLateral } from "@/components/ui/panel-lateral";
import { Sobretitulo } from "@/components/ui/textos";
import { estadoExistencias, UMBRAL_INVENTARIO_BAJO } from "@/modules/catalogo-inventario/reglas";
import { CategoriasAdmin } from "./categorias-admin";
import { FichaExistenciasAdmin } from "./ficha-existencias-admin";
import { FormularioMovimientoAdmin } from "./formulario-movimiento-admin";
import { FormularioProductoAdmin } from "./formulario-producto-admin";
import { HistorialMovimientosAdmin } from "./historial-movimientos-admin";
import { TablaExistenciasAdmin, type AccionProducto } from "./tabla-existencias-admin";
import { useInventario } from "./inventario";

const VISTAS = ["Existencias", "Historial de movimientos", "Categorías"] as const;

type Panel = { clase: "ficha" | "entrada" | "ajuste" | "producto"; idProducto: number | null };

// Gestión de inventario, productos y categorías (Figuras 34 a 39, RF-11 a RF-19)
export function InventarioAdmin() {
  const { sesion } = useSesion();
  const { productos, categorias, movimientos, cargando, error, recargar } = useInventario();
  const [vista, setVista] = useState<(typeof VISTAS)[number]>("Existencias");
  const [panel, setPanel] = useState<Panel | null>(null);
  const [idDesactivar, setIdDesactivar] = useState<number | null>(null);
  const [desactivando, setDesactivando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  if (!sesion) return null;

  const activos = productos.filter((p) => p.activo);
  const unidades = activos.reduce((suma, p) => suma + p.existencias, 0);
  const bajos = productos.filter((p) => estadoExistencias(p) === "Existencias bajas").length;
  const agotados = productos.filter((p) => estadoExistencias(p) === "Agotado").length;

  const productoPanel = productos.find((p) => p.idProducto === panel?.idProducto) ?? null;
  const productoDesactivar = productos.find((p) => p.idProducto === idDesactivar);

  const elegir = (accion: AccionProducto, idProducto: number) => {
    if (accion === "desactivar") return setIdDesactivar(idProducto);
    setPanel({ clase: accion === "editar" ? "producto" : accion, idProducto });
  };

  const terminar = (texto: string) => {
    setPanel(null);
    setAviso(texto);
    void recargar();
  };

  const confirmarDesactivar = async () => {
    if (idDesactivar === null || desactivando) return;
    setDesactivando(true);
    try {
      const respuesta = await fetch("/api/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idProducto: idDesactivar }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) {
        setAviso(resultado.error ?? "No se pudo desactivar el producto.");
        return;
      }
      setIdDesactivar(null);
      setAviso(`Producto desactivado: ${resultado.dato.nombre}`);
      await recargar();
    } catch {
      setAviso("No se pudo conectar con el servidor.");
    } finally {
      setDesactivando(false);
    }
  };

  const titulos: Record<Panel["clase"], [string, string]> = {
    ficha: ["Ficha de existencias", productoPanel?.nombre ?? ""],
    entrada: ["Movimiento de inventario", "Registrar entrada"],
    ajuste: ["Movimiento de inventario", "Registrar ajuste"],
    producto: ["Catálogo", productoPanel ? "Editar producto" : "Registrar producto"],
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>Administración · Inventario</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          Gestión de <em className="text-naranja">inventario</em>
        </h1>
        <p className="mt-2 text-gris">Controla las existencias y movimientos de tus productos musicales.</p>
      </div>
    {cargando && (
      <p className="text-sm text-gris">
        Cargando inventario desde PostgreSQL...
      </p>
    )}

    {error && (
      <p role="alert" className="text-sm text-red-700">
        {error}
      </p>
    )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
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
        <div className="flex gap-3">
          <Boton variante="secundario" onClick={() => setPanel({ clase: "producto", idProducto: null })}>Registrar producto</Boton>
          <Boton onClick={() => setPanel({ clase: "entrada", idProducto: null })}>Registrar entrada</Boton>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Indicador titulo="Productos registrados" valor={activos.length} detalle="Productos activos en catálogo" />
        <Indicador titulo="Unidades disponibles" valor={unidades} detalle="Suma total de existencias" />
        <Indicador titulo="Existencias bajas" valor={bajos} detalle={`Umbral de alerta: ${UMBRAL_INVENTARIO_BAJO} unidades`} />
        <Indicador titulo="Productos agotados" valor={agotados} detalle="Requieren reposición" />
      </div>

      {vista === "Existencias" && (
        <TablaExistenciasAdmin productos={productos} categorias={categorias} movimientos={movimientos} alElegir={elegir} />
      )}
      {vista === "Historial de movimientos" && <HistorialMovimientosAdmin productos={productos} movimientos={movimientos} />}
      {vista === "Categorías" && <CategoriasAdmin alTerminar={(texto) => { setAviso(texto); void recargar(); }} />}

      <PanelLateral
        abierto={panel !== null}
        alCerrar={() => setPanel(null)}
        sobretitulo={panel ? titulos[panel.clase][0] : ""}
        titulo={panel ? titulos[panel.clase][1] : ""}
      >
        {panel?.clase === "ficha" && productoPanel && (
          <FichaExistenciasAdmin
            producto={productoPanel}
            categorias={categorias}
            movimientos={movimientos}
            alElegir={(accion) => elegir(accion, productoPanel.idProducto)}
          />
        )}
        {(panel?.clase === "entrada" || panel?.clase === "ajuste") && (
          <FormularioMovimientoAdmin
            key={panel.clase}
            clase={panel.clase}
            productos={productos}
            idProductoInicial={panel.idProducto}
            idResponsable={sesion.usuario.idUsuario}
            alTerminar={terminar}
            alCancelar={() => setPanel(null)}
          />
        )}
        {panel?.clase === "producto" && (
          <FormularioProductoAdmin producto={productoPanel} categorias={categorias} alTerminar={terminar} alCancelar={() => setPanel(null)} />
        )}
      </PanelLateral>

      <Modal abierto={productoDesactivar !== undefined} alCerrar={() => setIdDesactivar(null)}>
        <h2 className="font-serif text-3xl">¿Desactivar {productoDesactivar?.nombre}?</h2>
        <p className="mt-3 text-sm text-gris">
          No se podrá agregar a nuevas compras. Sus movimientos y los pedidos donde aparece se conservan.
        </p>
        <div className="mt-8 flex justify-end gap-3">
          <Boton variante="secundario" onClick={() => setIdDesactivar(null)}>Cancelar</Boton>
          <Boton onClick={confirmarDesactivar} disabled={desactivando}>{desactivando ? "Desactivando..." : "Desactivar"}</Boton>
        </div>
      </Modal>

      <Aviso texto={aviso} alCerrar={cerrarAviso} />
    </div>
  );
}

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: number; detalle: string }) {
  return (
    <div className="border border-borde bg-papel p-6">
      <p className="text-sm text-gris">{titulo}</p>
      <p className="mt-3 font-serif text-4xl">{valor}</p>
      <p className="mt-2 text-xs text-gris">{detalle}</p>
    </div>
  );
}