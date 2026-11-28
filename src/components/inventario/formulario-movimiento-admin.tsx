"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo } from "@/components/ui/campo";
import { Icono } from "@/components/ui/icono";
import { cambioEnExistencias } from "@/modules/catalogo-inventario/reglas";
import type { Producto } from "@/modules/catalogo-inventario/schema";
import { LIMITES_CATALOGO, validarAjuste, validarCantidad } from "@/modules/catalogo-inventario/validaciones";

type TipoAjuste = "Ajuste positivo" | "Ajuste negativo";

export function FormularioMovimientoAdmin({
  clase,
  productos,
  idProductoInicial,
  alTerminar,
  alCancelar,
}: {
  clase: "entrada" | "ajuste";
  productos: Producto[];
  idProductoInicial: number | null;
  alTerminar: (texto: string) => void;
  alCancelar: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [procesando, setProcesando] = useState(false);
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


const enviar = async (e: FormEvent) => {
  e.preventDefault();

  if (procesando) return;

  if (!producto) {
    setErrores({
      general: "Selecciona un producto.",
    });
    return;
  }

  const errorTope =
    !validarCantidad(cantidad) && producto.existencias + Number(cantidad) > LIMITES_CATALOGO.existenciasMaximas
      ? `Las existencias no pueden superar ${LIMITES_CATALOGO.existenciasMaximas.toLocaleString("es-CR")} unidades.`
      : undefined;

  const nuevos =
    clase === "entrada"
      ? { cantidad: validarCantidad(cantidad) ?? errorTope }
      : validarAjuste(
          producto.existencias,
          tipo,
          cantidad,
          motivo
        );

  if (
    nuevos.cantidad ||
    ("motivo" in nuevos && nuevos.motivo)
  ) {
    setErrores(nuevos);
    return;
  }

  setProcesando(true);
  setErrores({});

  try {
    const respuesta = await fetch("/api/inventario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idProducto: producto.idProducto,
        tipo: clase === "entrada" ? "Entrada" : tipo,
        cantidad,
        motivo,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.ok) {
      setErrores({
        general:
          resultado.error ??
          "No fue posible registrar el movimiento.",
      });
      return;
    }

    alTerminar(
      `${
        clase === "entrada"
          ? "Entrada registrada"
          : "Ajuste registrado"
      }: ${producto.nombre} quedó con ${
        resultado.dato.existencias
      } unidades`
    );
  } catch (error) {
    console.error("Error al registrar movimiento:", error);

    setErrores({
      general: "No fue posible conectar con el servidor.",
    });
  } finally {
    setProcesando(false);
  }
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
        max={LIMITES_CATALOGO.cantidadMovimiento}
        step={1}
        inputMode="numeric"
        value={cantidad}
        onChange={(e) => {
          setCantidad(e.target.value);
          setErrores((actuales) => ({ ...actuales, cantidad: undefined }));
        }}
        error={errores.cantidad}
      />

      {clase === "ajuste" && (
        <AreaTexto
          etiqueta="Motivo del ajuste"
          placeholder="Ej. Producto dañado durante traslado"
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            setErrores((actuales) => ({ ...actuales, motivo: undefined }));
          }}
          error={errores.motivo}
          maxLength={LIMITES_CATALOGO.motivo}
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
        <Boton type="button" variante="secundario" onClick={alCancelar} className="rounded-md">Cancelar</Boton>
        <Boton type="submit" disabled={procesando} className="rounded-md">{procesando ? "Guardando..." : clase === "entrada" ? "Confirmar entrada" : "Confirmar ajuste"}</Boton>
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