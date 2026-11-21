"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Selector } from "@/components/ui/campo";
import { modificarCurso, registrarCurso } from "@/mocks/oferta";
import type { Curso } from "@/modules/academia/schema";
import type { DatosCurso, ErroresCurso } from "@/modules/academia/validaciones";

// Registro y modificación de cursos (RF-30, RF-31). Sin prototipo en el documento.
export function FormularioCursoAdmin({
  curso,
  alTerminar,
  alCancelar,
}: {
  curso: Curso | null;
  alTerminar: (texto: string) => void;
  alCancelar: () => void;
}) {
  const [datos, setDatos] = useState<DatosCurso>({
    nombre: curso?.nombre ?? "",
    descripcion: curso?.descripcion ?? "",
    cupoMaximo: curso ? String(curso.cupoMaximo) : "",
    estado: curso?.estado ?? "Abierto",
    imagenUrl: curso?.imagenUrl ?? "",
  });
  const [errores, setErrores] = useState<ErroresCurso>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const cambiar = (campo: keyof DatosCurso) => (e: { target: { value: string } }) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const resultado = curso ? modificarCurso(curso.idCurso, datos) : registrarCurso(datos);
    if (!resultado.ok) {
      setErrores(resultado.errores);
      setErrorGeneral(resultado.error ?? null);
      return;
    }
    alTerminar(curso ? `Curso actualizado: ${resultado.dato.nombre}` : `Curso registrado: ${resultado.dato.nombre}`);
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Campo etiqueta="Nombre" value={datos.nombre} onChange={cambiar("nombre")} error={errores.nombre} />
      <AreaTexto etiqueta="Descripción" value={datos.descripcion} onChange={cambiar("descripcion")} error={errores.descripcion} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Cupo máximo" type="number" min={1} step={1} value={datos.cupoMaximo} onChange={cambiar("cupoMaximo")} error={errores.cupoMaximo} />
        <Selector etiqueta="Estado" value={datos.estado} onChange={cambiar("estado")}>
          <option value="Abierto">Abierto</option>
          <option value="Cerrado">Cerrado</option>
        </Selector>
      </div>
      <Campo
        etiqueta="Ruta de la imagen (opcional)"
        placeholder="/img/cursos/nombre.jpg"
        value={datos.imagenUrl}
        onChange={cambiar("imagenUrl")}
      />

      {!curso && <p className="text-xs text-gris">El curso se registra sin profesor. Los horarios y el profesor se agregan después.</p>}
      {errorGeneral && <p className="text-sm text-red-700">{errorGeneral}</p>}

      <div className="flex justify-end gap-3">
        <Boton type="button" variante="secundario" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit">{curso ? "Guardar cambios" : "Registrar curso"}</Boton>
      </div>
    </form>
  );
}