"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Selector } from "@/components/ui/campo";
import { asignarProfesor } from "@/mocks/oferta";
import { profesores } from "@/mocks/usuarios";
import type { Curso } from "@/modules/academia/schema";

// Asignación de un profesor a un curso (RF-34). Sin prototipo en el documento.
export function ProfesorCursoAdmin({
  curso,
  alTerminar,
  alCancelar,
}: {
  curso: Curso;
  alTerminar: (texto: string) => void;
  alCancelar: () => void;
}) {
  const [idProfesor, setIdProfesor] = useState(curso.idProfesor ? String(curso.idProfesor) : "");
  const [error, setError] = useState<string | null>(null);
  const actual = profesores.find((p) => p.idUsuario === curso.idProfesor);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!idProfesor) return setError("Selecciona un profesor.");
    const resultado = asignarProfesor(curso.idCurso, Number(idProfesor));
    if (!resultado.ok) return setError(resultado.error);
    alTerminar(`${profesores.find((p) => p.idUsuario === Number(idProfesor))?.nombre} asignado a ${curso.nombre}`);
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <p className="text-sm text-gris">
        Profesor actual: <span className="font-medium text-tinta">{actual?.nombre ?? "Sin asignar"}</span>
      </p>
      <Selector etiqueta="Profesor" value={idProfesor} onChange={(e) => setIdProfesor(e.target.value)} error={error ?? undefined}>
        <option value="">Selecciona un profesor</option>
        {profesores
          .filter((p) => p.activo)
          .map((p) => (
            <option key={p.idUsuario} value={p.idUsuario}>{p.nombre}</option>
          ))}
      </Selector>
      <p className="text-xs text-gris">No se puede asignar si el profesor tiene otro curso en el mismo horario.</p>
      <div className="flex justify-end gap-3">
        <Boton type="button" variante="secundario" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit">Asignar profesor</Boton>
      </div>
    </form>
  );
}