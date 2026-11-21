"use client";

import { useCallback, useEffect, useState } from "react";
import type { Curso, Horario } from "@/modules/academia/schema";
import type { CursoAcademia } from "@/modules/academia/consultas";

export function useOferta() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [cuposDisponibles, setCuposDisponibles] = useState<Record<number, number>>({});
  const [nombresProfesores, setNombresProfesores] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/cursos", { cache: "no-store" });
      if (!respuesta.ok) throw new Error("No fue posible consultar los cursos.");
      const datos = await respuesta.json() as CursoAcademia[];
      if (!Array.isArray(datos)) throw new Error("La oferta académica tiene un formato inválido.");
      setCursos(datos.map((item) => item.curso));
      setHorarios(datos.flatMap((item) => item.horarios));
      setCuposDisponibles(Object.fromEntries(datos.map((item) => [item.curso.idCurso, item.cuposDisponibles])));
      setNombresProfesores(Object.fromEntries(datos.filter((item) => item.profesor && item.curso.idProfesor !== null).map((item) => [item.curso.idProfesor!, item.profesor!])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la oferta.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void recargar(); }, [recargar]);

  return { cursos, horarios, cuposDisponibles, nombresProfesores, cargando, error, recargar };
}
