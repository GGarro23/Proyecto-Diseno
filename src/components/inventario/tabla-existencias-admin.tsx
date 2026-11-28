"use client";

import { useState } from "react";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import { estadoExistencias, type EstadoExistencias } from "@/modules/catalogo-inventario/reglas";
import type { Categoria, MovimientoInventario, Producto } from "@/modules/catalogo-inventario/schema";
import { EstadoProductoAdmin } from "./estado-producto-admin";
import { formatearFecha } from "@/lib/formato";

export type AccionProducto = "ficha" | "entrada" | "ajuste" | "editar" | "desactivar";

const ESTADOS: EstadoExistencias[] = ["Disponible", "Existencias bajas", "Agotado", "Inactivo"];
const ORDENES = ["Nombre", "Menos existencias", "Más existencias"] as const;

const filtro = "border border-borde bg-white px-3 py-3 text-sm text-tinta outline-none focus:border-cafe";

export function TablaExistenciasAdmin({
  productos,
  categorias,
  movimientos,
  alElegir,
}: {
  productos: Producto[];
  categorias: Categoria[];
  movimientos: MovimientoInventario[];
  alElegir: (accion: AccionProducto, idProducto: number) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [idCategoria, setIdCategoria] = useState("Todas");
  const [estado, setEstado] = useState("Todos");
  const [orden, setOrden] = useState<(typeof ORDENES)[number]>("Nombre");
  const [menu, setMenu] = useState<{ idProducto: number; arriba?: number; abajo?: number; derecha: number } | null>(null);

  const texto = busqueda.trim().toLowerCase();
  const visibles = productos
    .filter((p) => !texto || p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto))
    .filter((p) => idCategoria === "Todas" || String(p.idCategoria) === idCategoria)
    .filter((p) => estado === "Todos" || estadoExistencias(p) === estado)
    .sort((a, b) =>
      orden === "Nombre"
        ? a.nombre.localeCompare(b.nombre)
        : orden === "Menos existencias"
          ? a.existencias - b.existencias
          : b.existencias - a.existencias
    );

  const ultimaActualizacion = (idProducto: number) =>
    movimientos
      .filter((m) => m.idProducto === idProducto)
      .map((m) => m.fecha)
      .sort()
      .at(-1);

  const productoMenu = productos.find((p) => p.idProducto === menu?.idProducto);
  const elegir = (accion: AccionProducto) => {
    if (menu) alElegir(accion, menu.idProducto);
    setMenu(null);
  };

  return (
    <section className="border border-borde bg-papel">
      <div className="grid gap-3 border-b border-borde p-5 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="flex items-center gap-3 border border-borde bg-white px-4">
          <Icono nombre="buscar" className="size-4 text-gris" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full py-3 text-sm outline-none"
          />
        </label>
        <select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)} className={filtro} aria-label="Categoría">
          <option value="Todas">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className={filtro} aria-label="Estado">
          <option value="Todos">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as (typeof ORDENES)[number])} className={filtro} aria-label="Orden">
          {ORDENES.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {visibles.length === 0 ? (
        <p className="p-10 text-center text-gris">No hay productos que coincidan con la búsqueda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
              <tr>
                <th className="px-5 py-3 font-medium">Producto</th>
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Categoría</th>
                <th className="px-5 py-3 text-right font-medium">Existencias</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Actualización</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => (
                <tr key={p.idProducto} className={`border-t border-borde ${p.activo ? "" : "text-gris"}`}>
                  <td className="px-5 py-3">
                    <button onClick={() => alElegir("ficha", p.idProducto)} className="flex items-center gap-4 text-left hover:text-naranja">
                      <Foto src={p.imagenUrl} alt={p.nombre} className="size-12 shrink-0" />
                      <span className="font-serif text-lg">{p.nombre}</span>
                    </button>
                  </td>
                  <td className="px-5 py-3">{p.codigo}</td>
                  <td className="px-5 py-3">{categorias.find((c) => c.idCategoria === p.idCategoria)?.nombre}</td>
                  <td className="px-5 py-3 text-right font-serif text-xl">{p.existencias}</td>
                  <td className="px-5 py-3">
                    <EstadoProductoAdmin producto={p} />
                  </td>
                  <td className="px-5 py-3 text-gris">{formatearFecha(ultimaActualizacion(p.idProducto))}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      aria-label={`Acciones de ${p.nombre}`}
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        const cabeAbajo = r.bottom + 240 < window.innerHeight;
                        setMenu({
                          idProducto: p.idProducto,
                          ...(cabeAbajo ? { arriba: r.bottom + 4 } : { abajo: window.innerHeight - r.top + 4 }),
                          derecha: window.innerWidth - r.right,
                        });
                      }}
                      className="rounded-full px-3 py-1 text-lg leading-none text-cafe hover:bg-crema"
                    >
                      ···
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {menu && productoMenu && (
        <>
          <button aria-label="Cerrar menú" className="fixed inset-0 z-40 cursor-default" onClick={() => setMenu(null)} onWheel={() => setMenu(null)} />
          <div role="menu" className="fixed z-50 flex w-52 flex-col border border-borde bg-papel py-2 text-sm shadow-lg" style={{ top: menu.arriba, bottom: menu.abajo, right: menu.derecha }}>
            <OpcionMenu texto="Ver detalle" alElegir={() => elegir("ficha")} />
            <OpcionMenu texto="Registrar entrada" alElegir={() => elegir("entrada")} />
            <OpcionMenu texto="Registrar ajuste" alElegir={() => elegir("ajuste")} />
            <OpcionMenu texto="Editar producto" alElegir={() => elegir("editar")} />
            {productoMenu.activo && <OpcionMenu texto="Desactivar producto" alElegir={() => elegir("desactivar")} />}
          </div>
        </>
      )}
    </section>
  );
}

function OpcionMenu({ texto, alElegir }: { texto: string; alElegir: () => void }) {
  return (
    <button role="menuitem" onClick={alElegir} className="px-4 py-2 text-left hover:bg-crema">
      {texto}
    </button>
  );
}