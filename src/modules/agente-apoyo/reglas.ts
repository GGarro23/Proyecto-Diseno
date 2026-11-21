import type { Curso, Inscripcion } from "@/modules/academia/schema";
import { tieneInventarioBajo, UMBRAL_INVENTARIO_BAJO } from "@/modules/catalogo-inventario/reglas";
import type { Producto } from "@/modules/catalogo-inventario/schema";
import { ocupacionCurso } from "@/modules/reportes/reportes";
import type { Recomendacion } from "./schema";

export const UMBRAL_OCUPACION_PROMOCION = 50;

export type Propuesta = { idElemento: number; motivo: string };

const pendiente = (r: Recomendacion, tipo: Recomendacion["tipo"]) => r.tipo === tipo && r.estado === "Pendiente";

export function productosParaReabastecer(productos: Producto[], recomendaciones: Recomendacion[]): Propuesta[] {
  const yaPendientes = new Set(recomendaciones.filter((r) => pendiente(r, "Reabastecimiento")).map((r) => r.idProducto));
  return productos
    .filter((p) => tieneInventarioBajo(p) && !yaPendientes.has(p.idProducto))
    .map((p) => ({
      idElemento: p.idProducto,
      motivo:
        p.existencias === 0
          ? "Producto agotado."
          : `Quedan ${p.existencias} ${p.existencias === 1 ? "unidad" : "unidades"}; el umbral de alerta es ${UMBRAL_INVENTARIO_BAJO}.`,
    }));
}

export function cursosParaPromocionar(cursos: Curso[], inscripciones: Inscripcion[], recomendaciones: Recomendacion[]): Propuesta[] {
  const yaPendientes = new Set(recomendaciones.filter((r) => pendiente(r, "Promoción académica")).map((r) => r.idCurso));
  return cursos
    .filter((c) => c.estado === "Abierto" && !yaPendientes.has(c.idCurso))
    .map((c) => ({ curso: c, ...ocupacionCurso(c, inscripciones) }))
    .filter(({ curso, inscritos, porcentaje }) => inscritos < curso.cupoMaximo && porcentaje < UMBRAL_OCUPACION_PROMOCION)
    .map(({ curso, inscritos, porcentaje }) => {
      const libres = curso.cupoMaximo - inscritos;
      return {
        idElemento: curso.idCurso,
        motivo: `Ocupación de ${porcentaje}% (${inscritos} de ${curso.cupoMaximo} cupos); quedan ${libres} ${libres === 1 ? "cupo disponible" : "cupos disponibles"}.`,
      };
    });
}