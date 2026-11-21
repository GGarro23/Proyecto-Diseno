"use client";

import Link from "next/link";
import { useState } from "react";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Icono } from "@/components/ui/icono";
import { Modal } from "@/components/ui/modal";
import { Sobretitulo } from "@/components/ui/textos";
import { cuposDisponibles, inscribir } from "@/mocks/academia";
import type { Sesion } from "@/mocks/sesion";
import type { Curso, Horario } from "@/modules/academia/schema";
import { useInscripciones } from "./inscripciones";

type Props = { curso: Curso; horarios: Horario[]; sesion: Sesion | null };

// Inscripción a un curso con confirmación (Figuras 18 y 19, RF-37, CU-14)
export function InscripcionCurso({ curso, horarios, sesion }: Props) {
  const inscripciones = useInscripciones();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sesion) {
    return <BotonEnlace href="/iniciar-sesion" className="self-start">Inicia sesión para inscribirte</BotonEnlace>;
  }

  const inscrito = inscripciones.some(
    (i) => i.idUsuario === sesion.usuario.idUsuario && i.idCurso === curso.idCurso && i.estado === "Activa"
  );
  if (inscrito) {
    return (
      <div className="flex items-center gap-6">
        <span className="bg-papel/90 px-5 py-3 text-sm font-medium text-cafe">Ya estás inscrito</span>
        <Link href="/panel" className="flex items-center gap-2 text-sm font-medium text-papel hover:underline">
          Ir a mi curso <Icono nombre="flecha" />
        </Link>
      </div>
    );
  }

  const cupos = cuposDisponibles(curso.idCurso, inscripciones);
  if (curso.estado === "Cerrado" || cupos === 0) {
    return (
      <Boton disabled className="self-start">
        {curso.estado === "Cerrado" ? "Curso cerrado" : "Sin cupos disponibles"}
      </Boton>
    );
  }

  const confirmar = () => {
    const resultado = inscribir(sesion.usuario.idUsuario, curso.idCurso);
    if (!resultado.ok) return setError(resultado.error);
    setAbierto(false);
  };

  return (
    <>
      <Boton onClick={() => { setError(null); setAbierto(true); }} className="self-start">
        Inscribirme
      </Boton>
      <Modal abierto={abierto} alCerrar={() => setAbierto(false)}>
        <div className="flex flex-col gap-4">
          <Sobretitulo>Confirmar inscripción</Sobretitulo>
          <h2 className="font-serif text-4xl">{curso.nombre}</h2>
          <p className="text-gris">Reservaremos uno de los cupos disponibles a tu nombre.</p>
          <div className="flex gap-3 bg-naranja-claro p-5">
            <Icono nombre="calendario" className="mt-0.5 size-5 text-naranja" />
            <div>
              <p className="font-medium">Horario semanal</p>
              {horarios.map((h) => (
                <p key={h.idHorario} className="text-sm text-gris">
                  {h.diaSemana} · {h.horaInicio}–{h.horaFin}
                </p>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-800">{error}</p>}
          <div className="flex gap-3">
            <Boton onClick={confirmar}>Confirmar inscripción</Boton>
            <Boton variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
          </div>
        </div>
      </Modal>
    </>
  );
}