"use client";

import { cuposDisponibles } from "@/mocks/academia";
import type { Curso } from "@/modules/academia/schema";
import { useInscripciones } from "./inscripciones";

// Disponibilidad del curso (RF-35): cupos, "Sin cupos" o "Cerrado"
export function EstadoCurso({ curso, claro = false }: { curso: Curso; claro?: boolean }) {
  const cupos = cuposDisponibles(curso.idCurso, useInscripciones());
  const disponible = curso.estado === "Abierto" && cupos > 0;
  const texto =
    curso.estado === "Cerrado"
      ? "Cerrado"
      : cupos === 0
        ? "Sin cupos"
        : cupos === 1
          ? "1 cupo disponible"
          : `${cupos} cupos disponibles`;

  return (
    <span className={`flex items-center gap-2 text-xs ${claro ? "text-papel" : "text-gris"}`}>
      <span className={`size-2 rounded-full ${disponible ? "bg-emerald-600" : "bg-red-700"}`} />
      {texto}
    </span>
  );
}