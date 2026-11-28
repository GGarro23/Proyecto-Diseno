"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Selector } from "@/components/ui/campo";
import { LIMITES_ACADEMIA, validarCurso } from "@/modules/academia/validaciones";
import type { Curso } from "@/modules/academia/schema";
import type { DatosCurso, ErroresCurso } from "@/modules/academia/validaciones";

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
  const [procesando, setProcesando] = useState(false);

  const cambiar = (campo: keyof DatosCurso) => (e: { target: { value: string } }) => {
    setDatos((d) => ({ ...d, [campo]: e.target.value }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (procesando) return;
    const erroresLocales = validarCurso(datos);
    setErrores(erroresLocales);
    if (Object.keys(erroresLocales).length) return;

    setErrorGeneral(null);
    setProcesando(true);
    try {
      const respuesta = await fetch("/api/cursos", {
        method: curso ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, ...(curso ? { idCurso: curso.idCurso } : {}) }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) {
        setErrores(resultado.errores ?? {});
        setErrorGeneral(resultado.error ?? "No se pudo guardar el curso.");
        return;
      }
      alTerminar(curso ? `Curso actualizado: ${resultado.dato.nombre}` : `Curso registrado: ${resultado.dato.nombre}`);
    } catch {
      setErrorGeneral("No se pudo conectar con el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Campo etiqueta="Nombre" value={datos.nombre} onChange={cambiar("nombre")} error={errores.nombre} maxLength={LIMITES_ACADEMIA.nombreCurso} />
      <AreaTexto etiqueta="Descripción" value={datos.descripcion} onChange={cambiar("descripcion")} error={errores.descripcion} maxLength={LIMITES_ACADEMIA.descripcionCurso} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Cupo máximo" type="number" min={1} max={LIMITES_ACADEMIA.cupoMaximo} step={1} inputMode="numeric" value={datos.cupoMaximo} onChange={cambiar("cupoMaximo")} error={errores.cupoMaximo} />
        <Selector etiqueta="Estado" value={datos.estado} onChange={cambiar("estado")} error={errores.estado}>
          <option value="Abierto">Abierto</option>
          <option value="Cerrado">Cerrado</option>
        </Selector>
      </div>
      <Campo
        etiqueta="Ruta de la imagen (opcional)"
        placeholder="/img/cursos/nombre.jpg"
        value={datos.imagenUrl}
        onChange={cambiar("imagenUrl")}
        error={errores.imagenUrl}
        maxLength={500}
      />

      {!curso && <p className="text-xs text-gris">El curso se registra sin profesor. Los horarios y el profesor se agregan después.</p>}
      {errorGeneral && <p className="text-sm text-red-700">{errorGeneral}</p>}

      <div className="flex justify-end gap-3">
        <Boton type="button" variante="secundario" onClick={alCancelar} className="rounded-md">Cancelar</Boton>
        <Boton type="submit" disabled={procesando} className="rounded-md">{procesando ? "Guardando..." : curso ? "Guardar cambios" : "Registrar curso"}</Boton>
      </div>
    </form>
  );
}