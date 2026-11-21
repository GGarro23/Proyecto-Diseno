import { cursosParaPromocionar, productosParaReabastecer, type Propuesta } from "@/modules/agente-apoyo/reglas";
import type { Recomendacion } from "@/modules/agente-apoyo/schema";
import { leerGuardadas, todasLasInscripciones } from "./academia";
import { inventarioDesde, leerEstadoInventario } from "./inventario";
import { leerEstadoOferta, ofertaDesde } from "./oferta";

// Simula lo que hará la API del agente de apoyo mientras no exista backend (RF-45 a RF-48).
// Lee el inventario de mocks/inventario.ts, los cursos de mocks/oferta.ts y las inscripciones de mocks/academia.ts.

type Resultado<T> = { ok: true; dato: T } | { ok: false; error: string };

const CLAVE = "intervallum-recomendaciones";
const oyentes = new Set<() => void>();

function avisar() {
  oyentes.forEach((f) => f());
}

export function suscribirRecomendaciones(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

// Para useSyncExternalStore: texto con las recomendaciones guardadas
export function leerEstadoRecomendaciones(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "[]";
  } catch {
    return "[]";
  }
}

export function recomendacionesDesde(estado: string): Recomendacion[] {
  return JSON.parse(estado);
}

function guardar(recomendaciones: Recomendacion[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(recomendaciones));
  } catch {}
  avisar();
}

// Registra las propuestas del agente como recomendaciones Pendientes
function registrar(tipo: Recomendacion["tipo"], propuestas: Propuesta[], actuales: Recomendacion[]): Recomendacion[] {
  let siguiente = Math.max(0, ...actuales.map((r) => r.idRecomendacion)) + 1;
  const fecha = new Date().toISOString();
  const nuevas = propuestas.map((p) => ({
    idRecomendacion: siguiente++,
    tipo,
    idProducto: tipo === "Reabastecimiento" ? p.idElemento : null,
    idCurso: tipo === "Promoción académica" ? p.idElemento : null,
    motivo: p.motivo,
    fechaGeneracion: fecha,
    estado: "Pendiente" as const,
    fechaRevision: null,
    idRevisor: null,
  }));
  if (nuevas.length > 0) guardar([...actuales, ...nuevas]);
  return nuevas;
}

// RF-45
export function generarReabastecimiento(): Resultado<Recomendacion[]> {
  try {
    const actuales = recomendacionesDesde(leerEstadoRecomendaciones());
    const { productos } = inventarioDesde(leerEstadoInventario());
    return { ok: true, dato: registrar("Reabastecimiento", productosParaReabastecer(productos, actuales), actuales) };
  } catch {
    return { ok: false, error: "El agente no pudo generar las recomendaciones. Intenta de nuevo." };
  }
}

// RF-46
export function generarPromocion(): Resultado<Recomendacion[]> {
  try {
    const actuales = recomendacionesDesde(leerEstadoRecomendaciones());
    const inscripciones = todasLasInscripciones(leerGuardadas());
    const { cursos } = ofertaDesde(leerEstadoOferta());
    return { ok: true, dato: registrar("Promoción académica", cursosParaPromocionar(cursos, inscripciones, actuales), actuales) };
  } catch {
    return { ok: false, error: "El agente no pudo generar las recomendaciones. Intenta de nuevo." };
  }
}

// RF-48: solo una vez, de Pendiente a Revisada, con fecha y responsable
export function marcarRevisada(idRecomendacion: number, idRevisor: number): Resultado<Recomendacion> {
  const recomendaciones = recomendacionesDesde(leerEstadoRecomendaciones());
  const recomendacion = recomendaciones.find((r) => r.idRecomendacion === idRecomendacion);
  if (!recomendacion) return { ok: false, error: "La recomendación no existe." };
  if (recomendacion.estado === "Revisada") return { ok: false, error: "Esta recomendación ya fue revisada." };
  recomendacion.estado = "Revisada";
  recomendacion.fechaRevision = new Date().toISOString();
  recomendacion.idRevisor = idRevisor;
  guardar(recomendaciones);
  return { ok: true, dato: recomendacion };
}