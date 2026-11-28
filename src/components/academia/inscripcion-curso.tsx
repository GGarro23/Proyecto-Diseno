"use client";

import Link from "next/link";
import { useState } from "react";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Icono } from "@/components/ui/icono";
import { Modal } from "@/components/ui/modal";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { Sobretitulo } from "@/components/ui/textos";
import type { Curso, Horario } from "@/modules/academia/schema";
import { avisarInscripcionesActualizadas, useInscripciones } from "./inscripciones";

type Props = { curso: Curso; horarios: Horario[]; cuposDisponibles: number };

export function InscripcionCurso({ curso, horarios, cuposDisponibles }: Props) {
  const { sesion } = useSesion();
  const inscripciones = useInscripciones();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  if (!sesion) {
    return <BotonEnlace href={`/iniciar-sesion?volver=/academia/${curso.idCurso}`} className="self-start rounded-md">Inicia sesión para inscribirte</BotonEnlace>;
  }

  const inscrito = confirmado || inscripciones.some(
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

  if (curso.estado === "Cerrado" || cuposDisponibles === 0) {
    return (
      <Boton disabled className="self-start rounded-md">
        {curso.estado === "Cerrado" ? "Curso cerrado" : "Sin cupos disponibles"}
      </Boton>
    );
  }

  const confirmar = async () => {
    if (procesando) return;
    setProcesando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idCurso: curso.idCurso }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) {
        setError(resultado.error ?? "No se pudo completar la inscripción.");
        return;
      }
      setConfirmado(true);
      setAbierto(false);
      avisarInscripcionesActualizadas();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <Boton onClick={() => { setError(null); setAbierto(true); }} className="self-start rounded-md">
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
            <Boton onClick={confirmar} disabled={procesando} className="rounded-md">{procesando ? "Inscribiendo..." : "Confirmar inscripción"}</Boton>
            <Boton variante="secundario" onClick={() => setAbierto(false)} className="rounded-md">Cancelar</Boton>
          </div>
        </div>
      </Modal>
    </>
  );
}