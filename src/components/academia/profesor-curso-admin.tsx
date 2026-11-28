"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Selector } from "@/components/ui/campo";
import type { Curso } from "@/modules/academia/schema";

type Profesor = { idUsuario: number; nombre: string };

export function ProfesorCursoAdmin({
  curso, alTerminar, alCancelar,
}: {
  curso: Curso;
  alTerminar: (texto: string) => void;
  alCancelar: () => void;
}) {
  const [idProfesor, setIdProfesor] = useState(curso.idProfesor ? String(curso.idProfesor) : "");
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let vigente = true;
    fetch("/api/profesores-cursos", { cache: "no-store" })
      .then(async (respuesta) => {
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.ok) throw new Error(resultado.error ?? "No se pudieron cargar los profesores.");
        return resultado.dato as Profesor[];
      })
      .then((lista) => { if (vigente) setProfesores(lista); })
      .catch((e) => { if (vigente) setError(e instanceof Error ? e.message : "Error consultando profesores."); });
    return () => { vigente = false; };
  }, []);

  const actual = profesores.find((p) => p.idUsuario === curso.idProfesor);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (procesando) return;
    if (!idProfesor) return setError("Selecciona un profesor.");
    setProcesando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/profesores-cursos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idCurso: curso.idCurso, idProfesor: Number(idProfesor) }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) return setError(resultado.error ?? "No se pudo asignar el profesor.");
      const nombre = profesores.find((p) => p.idUsuario === Number(idProfesor))?.nombre ?? "Profesor";
      alTerminar(`${nombre} asignado a ${curso.nombre}`);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-gris">
        Profesor actual: <span className="font-medium text-tinta">{actual?.nombre ?? (curso.idProfesor ? `Profesor N.º ${curso.idProfesor}` : "Sin asignar")}</span>
      </p>
      <Selector etiqueta="Profesor" value={idProfesor} onChange={(e) => setIdProfesor(e.target.value)} error={error ?? undefined}>
        <option value="">Selecciona un profesor</option>
        {profesores.map((p) => (
          <option key={p.idUsuario} value={p.idUsuario}>{p.nombre}</option>
        ))}
      </Selector>
      <p className="text-xs text-gris">La base de datos rechaza asignaciones con choques de horario.</p>
      <div className="flex justify-end gap-3">
        <Boton type="button" variante="secundario" onClick={alCancelar} className="rounded-md">Cancelar</Boton>
        <Boton type="submit" disabled={procesando} className="rounded-md">{procesando ? "Asignando..." : "Asignar profesor"}</Boton>
      </div>
    </form>
  );
}
