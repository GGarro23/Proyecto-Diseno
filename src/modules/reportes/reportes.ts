import type { Curso, Inscripcion } from "@/modules/academia/schema";
import type { Pedido } from "@/modules/ventas-pagos/schema";

// Cálculos de los reportes del Administrador (RF-44). Solo usan datos confirmados.
// Las usa el frontend y debe usarlas el backend.

export const MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export function pedidosConfirmados(pedidos: Pedido[]): Pedido[] {
  return pedidos.filter((p) => p.estadoPago === "Aprobado" && p.fechaConfirmacion);
}

// Total vendido por mes en un año (índice 0 = enero)
export function ventasPorMes(pedidos: Pedido[], anio: number): number[] {
  const meses = Array<number>(12).fill(0);
  for (const p of pedidosConfirmados(pedidos)) {
    const fecha = new Date(p.fechaConfirmacion!);
    if (fecha.getFullYear() === anio) meses[fecha.getMonth()] += p.total;
  }
  return meses;
}

export function ventasDelMes(pedidos: Pedido[], fecha = new Date()): number {
  return ventasPorMes(pedidos, fecha.getFullYear())[fecha.getMonth()];
}

// Ocupación de un curso: inscripciones activas sobre el cupo máximo
export function ocupacionCurso(curso: Curso, inscripciones: Inscripcion[]) {
  const inscritos = inscripciones.filter((i) => i.idCurso === curso.idCurso && i.estado === "Activa").length;
  return { inscritos, porcentaje: Math.round((inscritos / curso.cupoMaximo) * 100) };
}

// Ocupación de la academia: inscritos sobre cupos de los cursos abiertos
export function ocupacionAcademia(cursos: Curso[], inscripciones: Inscripcion[]): number {
  const abiertos = cursos.filter((c) => c.estado === "Abierto");
  const cupos = abiertos.reduce((suma, c) => suma + c.cupoMaximo, 0);
  const inscritos = abiertos.reduce((suma, c) => suma + ocupacionCurso(c, inscripciones).inscritos, 0);
  return cupos ? Math.round((inscritos / cupos) * 100) : 0;
}