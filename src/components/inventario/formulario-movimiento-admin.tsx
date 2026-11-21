"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo } from "@/components/ui/campo";
import { Icono } from "@/components/ui/icono";
import { registrarAjuste, registrarEntrada } from "@/mocks/inventario";
import { cambioEnExistencias } from "@/modules/catalogo-inventario/reglas";
import type { Producto } from "@/modules/catalogo-inventario/schema";
import { validarAjuste, validarCantidad } from "@/modules/catalogo-inventario/validaciones";

type TipoAjuste = "Ajuste positivo" | "Ajuste negativo";

// Registro de entradas y ajustes de inventario (Figuras 37 y 38, RF-18, RF-19)
export function FormularioMovimientoAdmin({
  clase,
  productos,
  idProductoInicial,
  idResponsable,
  alTerminar,
  alCancelar,
}: {
  clase: "entrada" | "ajuste";
  productos: Producto[];
  idProductoInicial: number | null;
  idResponsable: number;
  alTerminar: (texto: string) => void;
  alCancelar: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [idProducto, setIdProducto] = useState(String(idProductoInicial ?? productos[0]?.idProducto ?? ""));
  const [tipo, setTipo] = useState<TipoAjuste>("Ajuste positivo");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState<{ cantidad?: string; motivo?: string; general?: string }>({});

  const producto = productos.find((p) => String(p.idProducto) === idProducto);
  const texto = busqueda.trim().toLowerCase();
  const opciones = productos.filter(
    (p) => String(p.idProducto) === idProducto || !texto || p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto)
  );

  const tipoMovimiento = clase === "entrada" ? "Entrada" : tipo;
  const numero = Number(cantidad);
  const cambio = !validarCantidad(cantidad) ? cambioEnExistencias(tipoMovimiento, numero) : 0;
  const resultante = (producto?.existencias ?? 0) + cambio;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!producto) return setErrores({ general: "Selecciona un producto." });
    const nuevos = clase === "entrada" ? { cantidad: validarCantidad(cantidad) } : validarAjuste(producto.existencias, tipo, cantidad, motivo);
    if (nuevos.cantidad || ("motivo" in nuevos && nuevos.motivo)) return setErrores(nuevos);

    const resultado =
      clase === "entrada"
        ? registrarEntrada(producto.idProducto, cantidad, idResponsable)
        : registrarAjuste(producto.idProducto, tipo, cantidad, motivo, idResponsable);
    if (!resultado.ok) return setErrores({ general: resultado.error });
    alTerminar(`${clase === "entrada" ? "Entrada registrada" : "Ajuste registrado"}: ${producto.nombre} quedó con ${resultante} unidades`);
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-sm">
        Producto
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 border border-borde bg-white px-4">
            <Icono nombre="buscar" className="size-4 text-gris" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              aria-label="Buscar producto"
              className="w-full py-3 text-sm outline-none"
            />
          </label>
          <select
            value={idProducto}
            onChange={(e) => setIdProducto(e.target.value)}
            aria-label="Producto"
            className="w-full border border-borde bg-white px-4 py-3 text-sm outline-none focus:border-cafe"
          >
            {opciones.map((p) => (
              <option key={p.idProducto} value={p.idProducto}>
                {p.nombre}{p.activo ? "" : " (inactivo)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {producto && (
        <div className="grid grid-cols-2 gap-3">
          <Dato titulo="Código" valor={producto.codigo} />
          <Dato titulo="Existencias actuales" valor={String(producto.existencias)} />
        </div>
      )}

      {clase === "ajuste" && (
        <div className="flex flex-col gap-2 text-sm">
          Tipo de ajuste
          <div className="grid grid-cols-2 border border-borde p-1">
            {(["Ajuste positivo", "Ajuste negativo"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tipo === t}
                onClick={() => setTipo(t)}
                className={`py-3 text-sm font-medium ${tipo === t ? "bg-cafe text-papel" : "text-tinta hover:bg-crema"}`}
              >
                {t === "Ajuste positivo" ? "Aumentar" : "Disminuir"}
              </button>
            ))}
          </div>
        </div>
      )}

      <Campo
        etiqueta="Cantidad"
        type="number"
        min={1}
        step={1}
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        error={errores.cantidad}
      />

      {clase === "ajuste" && (
        <AreaTexto
          etiqueta="Motivo del ajuste"
          placeholder="Ej. Producto dañado durante traslado"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          error={errores.motivo}
        />
      )}

      <div className={`flex items-center justify-between border-l-4 p-5 ${resultante < 0 ? "border-red-700 bg-red-50" : "border-cafe bg-crema"}`}>
        <div>
          <p className="text-xs uppercase tracking-wider text-gris">Existencias resultantes</p>
          <p className="mt-1 text-sm">
            {cambio >= 0 ? "+" : "−"}
            {Math.abs(cambio)} {Math.abs(cambio) === 1 ? "unidad" : "unidades"}
          </p>
        </div>
        <p className="font-serif text-4xl">{resultante}</p>
      </div>

      {errores.general && <p className="text-sm text-red-700">{errores.general}</p>}

      <div className="flex justify-end gap-3">
        <Boton type="button" variante="secundario" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit">{clase === "entrada" ? "Confirmar entrada" : "Confirmar ajuste"}</Boton>
      </div>
    </form>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-crema p-4">
      <p className="text-xs uppercase tracking-wider text-gris">{titulo}</p>
      <p className="mt-2 font-serif text-2xl">{valor}</p>
    </div>
  );
}