import { analizarCsv, estadoEjecucion } from "@/modules/etl/reglas";
import type { EjecucionETL, ErrorETL } from "@/modules/etl/schema";
import { cargarProductosEtl, inventarioDesde, leerEstadoInventario } from "./inventario";

// Simula lo que hará la API del ETL mientras no exista backend (RF-49, RF-50).
// Los productos importados se guardan en mocks/inventario.ts.

const CLAVE_EJECUCIONES = "intervallum-ejecuciones-etl";
const CLAVE_ERRORES = "intervallum-errores-etl";
const oyentes = new Set<() => void>();

type Historial = { ejecuciones: EjecucionETL[]; errores: ErrorETL[] };

function avisar() {
  oyentes.forEach((f) => f());
}

export function suscribirEtl(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

// Para useSyncExternalStore: texto con las ejecuciones y errores guardados
export function leerEstadoEtl(): string {
  try {
    return JSON.stringify([localStorage.getItem(CLAVE_EJECUCIONES), localStorage.getItem(CLAVE_ERRORES)]);
  } catch {
    return "[null,null]";
  }
}

export function etlDesde(estado: string): Historial {
  const [ejecuciones, errores] = JSON.parse(estado) as (string | null)[];
  return { ejecuciones: ejecuciones ? JSON.parse(ejecuciones) : [], errores: errores ? JSON.parse(errores) : [] };
}

// RF-49: extrae, valida y carga el CSV. Toda ejecución queda registrada, también las fallidas.
export function ejecutarImportacion(nombreArchivo: string, texto: string, idAdministrador: number): EjecucionETL {
  const historial = etlDesde(leerEstadoEtl());
  const idEjecucion = Math.max(0, ...historial.ejecuciones.map((e) => e.idEjecucion)) + 1;
  const { productos, categorias } = inventarioDesde(leerEstadoInventario());

  let filasAceptadas = 0;
  let filasRechazadas = 0;
  let errores: Omit<ErrorETL, "idError" | "idEjecucion">[] = [];
  try {
    const analisis = analizarCsv(texto, productos, categorias);
    errores = analisis.errores;
    if (analisis.estructuraValida) {
      const carga = cargarProductosEtl(analisis.validas, idEjecucion);
      filasAceptadas = carga.aceptadas;
      filasRechazadas = analisis.filasRechazadas + carga.errores.length;
      errores = [...errores, ...carga.errores];
    }
  } catch {
    errores = [{ numeroFila: null, campo: null, motivo: "El archivo no se pudo procesar como CSV." }];
  }

  const ejecucion: EjecucionETL = {
    idEjecucion,
    idAdministrador,
    nombreArchivo,
    fechaEjecucion: new Date().toISOString(),
    estado: estadoEjecucion(filasAceptadas, filasRechazadas),
    filasAceptadas,
    filasRechazadas,
  };
  let idError = Math.max(0, ...historial.errores.map((e) => e.idError));
  const nuevos = errores.map((e) => ({ idError: ++idError, idEjecucion, ...e }));
  try {
    localStorage.setItem(CLAVE_EJECUCIONES, JSON.stringify([...historial.ejecuciones, ejecucion]));
    localStorage.setItem(CLAVE_ERRORES, JSON.stringify([...historial.errores, ...nuevos]));
  } catch {}
  avisar();
  return ejecucion;
}