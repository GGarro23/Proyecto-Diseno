"use client";

import { useCallback, useEffect, useState } from "react";
import type { Curso, Horario } from "@/modules/academia/schema";
import type { CursoAcademia } from "@/modules/academia/consultas";

type ResultadoOferta =
  | { ok: true; datos: CursoAcademia[] }
  | { ok: false; error: string };

async function pedirOferta(): Promise<ResultadoOferta> {
  try {
    const respuesta = await fetch("/api/cursos", { cache: "no-store" });
    if (!respuesta.ok) throw new Error("No fue posible consultar los cursos.");
    const datos = await respuesta.json() as CursoAcademia[];
    if (!Array.isArray(datos)) throw new Error("La oferta académica tiene un formato inválido.");
    return { ok: true, datos };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo cargar la oferta." };
  }
}

export function useOferta() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [cuposDisponibles, setCuposDisponibles] = useState<Record<number, number>>({});
  const [nombresProfesores, setNombresProfesores] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aplicar = useCallback((resultado: ResultadoOferta) => {
    if (resultado.ok) {
      const { datos } = resultado;
      setCursos(datos.map((item) => item.curso));
      setHorarios(datos.flatMap((item) => item.horarios));
      setCuposDisponibles(Object.fromEntries(datos.map((item) => [item.curso.idCurso, item.cuposDisponibles])));
      setNombresProfesores(Object.fromEntries(datos.filter((item) => item.profesor && item.curso.idProfesor !== null).map((item) => [item.curso.idProfesor!, item.profesor!])));
      setError(null);
    } else {
      setError(resultado.error);
    }
    setCargando(false);
  }, []);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    aplicar(await pedirOferta());
  }, [aplicar]);

  useEffect(() => {
    let vigente = true;
    pedirOferta().then((resultado) => {
      if (vigente) aplicar(resultado);
    });
    return () => {
      vigente = false;
    };
  }, [aplicar]);

  return { cursos, horarios, cuposDisponibles, nombresProfesores, cargando, error, recargar };
}
