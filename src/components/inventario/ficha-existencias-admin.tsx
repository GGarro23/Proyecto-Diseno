"use client";

import { Boton } from "@/components/ui/boton";
import { Foto } from "@/components/ui/foto";
import { formatearColones, formatearFecha } from "@/lib/formato";
import { calcularSaldos } from "@/modules/catalogo-inventario/reglas";
import type {
  Categoria,
  MovimientoInventario,
  Producto,
} from "@/modules/catalogo-inventario/schema";
import { EstadoProductoAdmin } from "./estado-producto-admin";
import {
  cantidadConSigno,
  origenMovimiento,
} from "./historial-movimientos-admin";
import type { AccionProducto } from "./tabla-existencias-admin";

export function FichaExistenciasAdmin({
  producto,
  categorias,
  movimientos,
  alElegir,
}: {
  producto: Producto;
  categorias: Categoria[];
  movimientos: MovimientoInventario[];
  alElegir: (accion: AccionProducto) => void;
}) {
  const recientes = calcularSaldos(movimientos, [producto])
    .filter((m) => m.idProducto === producto.idProducto)
    .reverse()
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <Foto
        src={producto.imagenUrl}
        alt={producto.nombre}
        className="aspect-[2/1] w-full"
      />

      <div className="border-b border-borde pb-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gris">{producto.codigo}</p>
          <EstadoProductoAdmin producto={producto} />
        </div>
        <h3 className="mt-2 font-serif text-3xl">{producto.nombre}</h3>
        <p className="mt-2 text-sm text-gris">
          {
            categorias.find((c) => c.idCategoria === producto.idCategoria)
              ?.nombre
          }{" "}
          · {formatearColones(producto.precio)}
        </p>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gris">Existencias actuales</p>
          <p className="mt-1 text-sm text-gris">
            Última actualización: {formatearFecha(recientes[0]?.fecha)}
          </p>
        </div>
        <p className="font-serif text-5xl">{producto.existencias}</p>
      </div>

      <div>
        <h4 className="font-serif text-2xl">Movimientos recientes</h4>
        {recientes.length === 0 ? (
          <p className="mt-2 text-sm text-gris">
            Aún no hay movimientos registrados para este producto.
          </p>
        ) : (
          <ul className="mt-2">
            {recientes.map((m) => (
              <li
                key={m.idMovimiento}
                className="flex items-center justify-between gap-4 border-b border-borde py-3 text-sm"
              >
                <div>
                  <p>{m.tipo}</p>
                  <p className="mt-1 text-xs text-gris">
                    {formatearFecha(m.fecha)} · {origenMovimiento(m)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{cantidadConSigno(m)}</p>
                  <p className="mt-1 text-xs text-gris">
                    {m.saldoAnterior === null || m.saldoNuevo === null
                      ? "No reconstruible"
                      : `${m.saldoAnterior} → ${m.saldoNuevo}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Boton variante="enlace" onClick={() => alElegir("editar")}>
          Editar producto
        </Boton>
        <Boton variante="secundario" onClick={() => alElegir("ajuste")} className="rounded-md">
          Registrar ajuste
        </Boton>
        <Boton onClick={() => alElegir("entrada")} className="rounded-md">Registrar entrada</Boton>
      </div>
    </div>
  );
}
