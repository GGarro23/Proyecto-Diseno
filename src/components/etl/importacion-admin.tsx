"use client";

import { Fragment, useCallback, useState, type DragEvent } from "react";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Icono } from "@/components/ui/icono";
import { Sobretitulo } from "@/components/ui/textos";
import { llamarApi } from "@/lib/api";
import { COLUMNAS_OBLIGATORIAS, COLUMNAS_OPCIONALES, PLANTILLA_CSV } from "@/modules/etl/reglas";
import type { EjecucionETL } from "@/modules/etl/schema";
import { useImportaciones } from "./importaciones";

const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB (Figura 33)

const COLORES: Record<EjecucionETL["estado"], string> = {
  Exitosa: "border-borde text-cafe",
  "Parcialmente Exitosa": "border-naranja/40 bg-naranja-claro text-naranja-oscuro",
  Fallida: "border-naranja bg-naranja text-papel",
};

// Lee el archivo como UTF-8; si no lo es (CSV guardado por Excel), como Windows-1252
async function leerTexto(archivo: File): Promise<string> {
  const bytes = await archivo.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

// Importación de productos e inventario desde CSV y su historial (Figura 33, RF-49, RF-50)
export function ImportacionAdmin() {
  const { sesion } = useSesion();
  const { dato, cargando, error, recargar } = useImportaciones();
  const { ejecuciones, errores } = dato;
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  if (!sesion) return null;

  const elegir = (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setArchivo(null);
      return setErrorArchivo("El archivo debe ser .csv.");
    }
    if (f.size > TAMANO_MAXIMO) {
      setArchivo(null);
      return setErrorArchivo("El archivo supera el máximo de 10 MB.");
    }
    setErrorArchivo(null);
    setArchivo(f);
  };

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    elegir(e.dataTransfer.files[0]);
  };

  const importar = async () => {
    if (!archivo) return;
    setImportando(true);
    const resultado = await llamarApi<Pick<EjecucionETL, "idEjecucion" | "estado" | "filasAceptadas" | "filasRechazadas">>("/api/etl", "POST", {
      nombreArchivo: archivo.name,
      contenido: await leerTexto(archivo),
    });
    setImportando(false);
    if (!resultado.ok) return setErrorArchivo(resultado.error);
    const ejecucion = resultado.dato;
    setArchivo(null);
    recargar();
    setAbierta(ejecucion.filasRechazadas > 0 || ejecucion.estado === "Fallida" ? ejecucion.idEjecucion : null);
    setAviso(`Importación ${ejecucion.estado.toLowerCase()}: ${ejecucion.filasAceptadas} aceptadas, ${ejecucion.filasRechazadas} rechazadas`);
  };

  const descargarPlantilla = () => {
    const url = URL.createObjectURL(new Blob([PLANTILLA_CSV], { type: "text/csv;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "plantilla-inventario.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const historial = [...ejecuciones].sort((a, b) => b.idEjecucion - a.idEjecucion);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Sobretitulo>Administración · Integración de datos</Sobretitulo>
        <h1 className="mt-3 font-serif text-5xl">
          Importar <em className="text-naranja">inventario</em>
        </h1>
        <p className="mt-2 text-gris">Carga un archivo CSV. Validamos su estructura y cada fila antes de crear productos.</p>
      </div>

      <section className="flex flex-col gap-5 border border-borde bg-papel p-7">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={`flex cursor-pointer flex-col items-center gap-3 border border-dashed px-6 py-14 text-center ${
            arrastrando ? "border-naranja bg-naranja-claro" : "border-cafe/40 bg-crema hover:border-cafe"
          }`}
        >
          <Icono nombre="subir" className="size-9 text-cafe" />
          <span className="font-medium">{archivo ? archivo.name : "Arrastra tu archivo CSV aquí"}</span>
          <span className="text-xs text-gris">o haz clic para seleccionar · máximo 10 MB</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              elegir(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {errorArchivo && <p className="text-sm text-red-700">{errorArchivo}</p>}

        <div className="flex flex-wrap items-center justify-between gap-4 bg-naranja-claro/60 px-6 py-5">
          <div>
            <p className="font-medium">Plantilla de inventario</p>
            <p className="mt-1 text-sm text-gris">
              Obligatorias: {COLUMNAS_OBLIGATORIAS.join(", ")}. Opcionales: {COLUMNAS_OPCIONALES.join(", ")}.
            </p>
          </div>
          <Boton variante="enlace" onClick={descargarPlantilla}>Descargar plantilla</Boton>
        </div>

        <div className="flex justify-end gap-3">
          {archivo && <Boton variante="secundario" onClick={() => setArchivo(null)}>Quitar archivo</Boton>}
          <Boton onClick={importar} disabled={!archivo || importando}>{importando ? "Importando..." : "Importar archivo"}</Boton>
        </div>
      </section>

      <section className="border border-borde bg-papel">
        <h2 className="border-b border-borde px-7 py-5 font-serif text-3xl">Historial de importaciones</h2>
        {cargando ? (
          <p className="p-10 text-center text-sm text-gris">Cargando historial…</p>
        ) : error ? (
          <p className="p-10 text-center text-red-700">{error}</p>
        ) : historial.length === 0 ? (
          <p className="p-10 text-center text-gris">Todavía no hay importaciones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
                <tr>
                  <th className="px-5 py-3 font-medium">Ejecución</th>
                  <th className="px-5 py-3 font-medium">Fecha y hora</th>
                  <th className="px-5 py-3 font-medium">Archivo</th>
                  <th className="px-5 py-3 font-medium">Responsable</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Aceptadas</th>
                  <th className="px-5 py-3 text-right font-medium">Rechazadas</th>
                  <th className="px-5 py-3 text-right font-medium">Errores</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((e) => {
                  const propios = errores.filter((x) => x.idEjecucion === e.idEjecucion);
                  const expandida = abierta === e.idEjecucion;
                  return (
                    <Fragment key={e.idEjecucion}>
                      <tr className="border-t border-borde">
                        <td className="px-5 py-4 text-gris">N.º {e.idEjecucion}</td>
                        <td className="px-5 py-4">{e.fechaEjecucion.slice(0, 16).replace("T", " ")}</td>
                        <td className="px-5 py-4 font-medium">{e.nombreArchivo}</td>
                        <td className="px-5 py-4">{e.responsable}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${COLORES[e.estado]}`}>
                            {e.estado}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">{e.filasAceptadas}</td>
                        <td className="px-5 py-4 text-right">{e.filasRechazadas}</td>
                        <td className="px-5 py-4 text-right">
                          {propios.length === 0 ? (
                            <span className="text-gris">—</span>
                          ) : (
                            <button onClick={() => setAbierta(expandida ? null : e.idEjecucion)} className="text-naranja hover:underline">
                              {expandida ? "Ocultar" : `Ver ${propios.length}`}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandida && (
                        <tr className="bg-crema">
                          <td colSpan={8} className="px-5 py-4">
                            <table className="w-full text-sm">
                              <thead className="text-left text-xs uppercase tracking-wider text-gris">
                                <tr>
                                  <th className="w-24 pb-2 font-medium">Fila</th>
                                  <th className="w-36 pb-2 font-medium">Campo</th>
                                  <th className="pb-2 font-medium">Motivo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {propios.map((x) => (
                                  <tr key={x.idError} className="border-t border-borde">
                                    <td className="py-2">{x.numeroFila ?? "Archivo"}</td>
                                    <td className="py-2">{x.campo ?? "—"}</td>
                                    <td className="py-2">{x.motivo}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Aviso texto={aviso} alCerrar={cerrarAviso} />
    </div>
  );
}
