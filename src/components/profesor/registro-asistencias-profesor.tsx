"use client";

import { useState } from "react";
import { useAsistencias } from "@/components/academia/asistencias";
import { Avatar } from "@/components/ui/avatar";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/textos";
import { registrarAsistencias } from "@/mocks/academia";
import type { Asistencia, Inscripcion } from "@/modules/academia/schema";

type Estado = Asistencia["estadoAsistencia"];
type Props = {
  idProfesor: number;
  idCurso: number;
  inscripciones: Inscripcion[]; // activas del curso
  nombreDe: (idUsuario: number) => string;
};

// Registro y consulta de asistencias de una sesión (Figura 26, RF-42, RF-43)
export function RegistroAsistenciasProfesor({ idProfesor, idCurso, inscripciones, nombreDe }: Props) {
  const asistencias = useAsistencias();
  const [fecha, setFecha] = useState(() => new Date().toLocaleDateString("en-CA")); // AAAA-MM-DD
  const [marcas, setMarcas] = useState<Record<number, Estado>>({});
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);

  // Lo ya registrado para esa fecha se muestra en modo consulta (RF-43) y no se repite (RF-42)
  const registradas = asistencias.filter(
    (a) => a.fecha === fecha && inscripciones.some((i) => i.idInscripcion === a.idInscripcion)
  );
  const registrada = (idInscripcion: number) => registradas.some((a) => a.idInscripcion === idInscripcion);
  const pendientes = inscripciones.filter((i) => !registrada(i.idInscripcion));
  const etiqueta =
    registradas.length === 0 ? "Sin registro previo" : pendientes.length === 0 ? "Registrada" : "Registro parcial";

  const estadoDe = (idInscripcion: number): Estado =>
    registradas.find((a) => a.idInscripcion === idInscripcion)?.estadoAsistencia ?? marcas[idInscripcion] ?? "Presente";

  const alternar = (idInscripcion: number) =>
    setMarcas({ ...marcas, [idInscripcion]: estadoDe(idInscripcion) === "Presente" ? "Ausente" : "Presente" });

  const guardar = () => {
    const resultado = registrarAsistencias(
      idProfesor,
      idCurso,
      fecha,
      pendientes.map((i) => ({ idInscripcion: i.idInscripcion, estadoAsistencia: estadoDe(i.idInscripcion) }))
    );
    setMensaje(resultado.ok ? { texto: "Asistencia guardada.", error: false } : { texto: resultado.error, error: true });
    if (resultado.ok) setMarcas({});
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <label className="flex flex-col gap-2 text-sm">
          Fecha de la sesión
          <input
            type="date"
            value={fecha}
            onChange={(e) => { setFecha(e.target.value); setMarcas({}); setMensaje(null); }}
            className="border border-borde bg-white px-4 py-2 text-sm outline-none focus:border-cafe"
          />
        </label>
        <Insignia>{etiqueta}</Insignia>
      </div>

      {inscripciones.length === 0 ? (
        <p className="text-gris">El curso no tiene estudiantes inscritos.</p>
      ) : (
        <ul>
          {inscripciones.map((i) => {
            const estado = estadoDe(i.idInscripcion);
            return (
              <li key={i.idInscripcion} className="flex items-center gap-4 border-b border-borde py-4">
                <Avatar nombre={nombreDe(i.idUsuario)} />
                <span className="flex-1 font-medium">{nombreDe(i.idUsuario)}</span>
                <button
                  onClick={() => alternar(i.idInscripcion)}
                  disabled={registrada(i.idInscripcion)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs ${
                    estado === "Presente" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                  } disabled:cursor-default`}
                >
                  <span className={`size-2 rounded-full ${estado === "Presente" ? "bg-emerald-600" : "bg-red-700"}`} />
                  {estado}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {mensaje && <p className={`text-sm ${mensaje.error ? "text-red-800" : "text-gris"}`}>{mensaje.texto}</p>}
      {pendientes.length > 0 && (
        <Boton onClick={guardar} className="self-start">Guardar asistencia</Boton>
      )}
    </div>
  );
}