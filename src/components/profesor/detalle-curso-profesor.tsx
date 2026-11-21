"use client";

import Link from "next/link";
import { useState } from "react";
import { useAsistencias } from "@/components/academia/asistencias";
import { useInscripciones } from "@/components/academia/inscripciones";
import { Avatar } from "@/components/ui/avatar";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import { Pestanias } from "@/components/ui/pestanias";
import { Insignia, Sobretitulo } from "@/components/ui/textos";
import { cursos, horarios } from "@/mocks/cursos";
import { estudiantes } from "@/mocks/usuarios";
import type { Sesion } from "@/modules/autenticacion-usuarios/schema";
import { RegistroAsistenciasProfesor } from "./registro-asistencias-profesor";

// Curso asignado al Profesor (Figuras 25 y 26, RF-40, RF-41, RF-42, RF-43)
export function DetalleCursoProfesor({ idCurso, sesion }: { idCurso: number; sesion: Sesion }) {
  const inscripciones = useInscripciones();
  const asistencias = useAsistencias();
  const [pestana, setPestana] = useState("Resumen");

  const curso = cursos.find((c) => c.idCurso === idCurso);
  // RF-40 y RF-41: solo cursos asignados al profesor autenticado
  if (!curso || curso.idProfesor !== sesion.usuario.idUsuario) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 border border-borde bg-papel p-12 text-center">
        <p className="text-gris">No tienes asignado este curso.</p>
        <Link href="/panel" className="text-sm text-naranja hover:underline">Volver a mis cursos</Link>
      </div>
    );
  }

  const horariosCurso = horarios.filter((h) => h.idCurso === idCurso);
  const activas = inscripciones.filter((i) => i.idCurso === idCurso && i.estado === "Activa");
  const nombreDe = (idUsuario: number) => estudiantes.find((e) => e.idUsuario === idUsuario)?.nombre ?? `Estudiante ${idUsuario}`;

  // Porcentaje de asistencia de una inscripción
  const asistenciaDe = (idInscripcion: number) => {
    const propias = asistencias.filter((a) => a.idInscripcion === idInscripcion);
    if (propias.length === 0) return "Sin sesiones registradas";
    const presentes = propias.filter((a) => a.estadoAsistencia === "Presente").length;
    return `${Math.round((presentes / propias.length) * 100)}% asistencia`;
  };

  return (
    <div className="flex flex-col gap-8">
      <nav className="flex items-center gap-3 text-xs text-gris">
        <Link href="/panel" className="hover:text-naranja">← Volver</Link>
        <span className="h-4 w-px bg-borde" />
        <Link href="/panel" className="hover:text-naranja">Mis cursos</Link>
        <span>/</span>
        <span className="text-tinta">{curso.nombre}</span>
      </nav>

      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <Foto src={curso.imagenUrl} alt={curso.nombre} className="min-h-[320px]" />
        <div className="flex flex-col justify-center gap-4 bg-cafe px-12 py-10 text-papel">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja-claro">Curso asignado · {curso.estado}</p>
          <h1 className="font-serif text-5xl">{curso.nombre}</h1>
          <div className="flex flex-wrap items-center gap-6 border-t border-papel/20 pt-5 text-sm">
            {horariosCurso.map((h) => (
              <span key={h.idHorario} className="flex items-center gap-2">
                <Icono nombre="calendario" className="size-4" />
                {h.diaSemana} · {h.horaInicio}–{h.horaFin}
              </span>
            ))}
            <span className="flex items-center gap-2">
              <Icono nombre="persona" className="size-4" />
              {activas.length} estudiantes
            </span>
          </div>
        </div>
      </div>

      <div>
        <Pestanias opciones={["Resumen", "Estudiantes", "Asistencias"]} activa={pestana} alCambiar={setPestana} />
        <div className="border border-t-0 border-borde bg-papel p-8">
          {pestana === "Resumen" && (
            <div className="flex flex-col gap-3">
              <Sobretitulo>Descripción</Sobretitulo>
              <p className="leading-relaxed text-gris">{curso.descripcion}</p>
              <p className="text-sm text-gris">Cupo máximo: {curso.cupoMaximo} estudiantes</p>
            </div>
          )}

          {pestana === "Estudiantes" &&
            (activas.length === 0 ? (
              <p className="text-gris">El curso no tiene estudiantes inscritos.</p>
            ) : (
              <ul>
                {activas.map((i) => (
                  <li key={i.idInscripcion} className="flex items-center gap-4 border-b border-borde py-4">
                    <Avatar nombre={nombreDe(i.idUsuario)} />
                    <div className="flex-1">
                      <p className="font-medium">{nombreDe(i.idUsuario)}</p>
                      <p className="text-sm text-gris">{asistenciaDe(i.idInscripcion)}</p>
                    </div>
                    <Insignia>{i.estado}</Insignia>
                  </li>
                ))}
              </ul>
            ))}

          {pestana === "Asistencias" && (
            <RegistroAsistenciasProfesor idProfesor={sesion.usuario.idUsuario} idCurso={idCurso} inscripciones={activas} nombreDe={nombreDe} />
          )}
        </div>
      </div>
    </div>
  );
}