"use client";

import { cuposDisponibles as calcularCuposMock }
  from "@/mocks/academia";
import type { Curso } from "@/modules/academia/schema";
import { useInscripciones } from "./inscripciones";

type Props = {
  curso: Curso;
  claro?: boolean;
  cuposDisponibles?: number;
};

export function EstadoCurso({
  curso,
  claro = false,
  cuposDisponibles: cuposBD,
}: Props) {
  // Compatibilidad temporal con las pantallas
  // que todavía utilizan inscripciones simuladas.
  const inscripciones = useInscripciones();

  // Priorizar siempre los datos reales de PostgreSQL.
const cupos =
  cuposBD ??
  calcularCuposMock(curso.idCurso, inscripciones);

  const disponible =
    curso.estado === "Abierto" && cupos > 0;

  const texto =
    curso.estado === "Cerrado"
      ? "Cerrado"
      : cupos === 0
        ? "Sin cupos"
        : cupos === 1
          ? "1 cupo disponible"
          : `${cupos} cupos disponibles`;

  return (
    <span
      className={`flex items-center gap-2 text-xs ${
        claro ? "text-papel" : "text-gris"
      }`}
    >
      <span
        className={`size-2 rounded-full ${
          disponible ? "bg-emerald-600" : "bg-red-700"
        }`}
      />
      {texto}
    </span>
  );
}