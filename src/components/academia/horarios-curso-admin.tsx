"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campo";
import { DIAS } from "@/lib/horarios";
import { modificarHorario, registrarHorario } from "@/mocks/oferta";
import type { DiaSemana, Horario } from "@/modules/academia/schema";
import type { DatosHorario } from "@/modules/academia/validaciones";

// Registro y modificación de horarios de un curso (RF-32, RF-33). Sin prototipo en el documento.
export function HorariosCursoAdmin({
  idCurso,
  horarios,
  alAvisar,
}: {
  idCurso: number;
  horarios: Horario[];
  alAvisar: (texto: string) => void;
}) {
  const [edicion, setEdicion] = useState<number | null>(null);
  const propios = horarios
    .filter((h) => h.idCurso === idCurso)
    .sort((a, b) => DIAS.indexOf(a.diaSemana) - DIAS.indexOf(b.diaSemana) || a.horaInicio.localeCompare(b.horaInicio));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="font-serif text-2xl">Sesiones semanales</h3>
        {propios.length === 0 ? (
          <p className="mt-2 text-sm text-gris">Este curso todavía no tiene horarios.</p>
        ) : (
          <ul className="mt-2">
            {propios.map((h) =>
              edicion === h.idHorario ? (
                <li key={h.idHorario} className="border-b border-borde py-4">
                  <FormularioHorario
                    inicial={h}
                    textoBoton="Guardar"
                    alGuardar={(datos) => modificarHorario(h.idHorario, datos)}
                    alTerminar={() => {
                      setEdicion(null);
                      alAvisar("Horario actualizado");
                    }}
                    alCancelar={() => setEdicion(null)}
                  />
                </li>
              ) : (
                <li key={h.idHorario} className="flex items-center justify-between gap-4 border-b border-borde py-4 text-sm">
                  <span>
                    <span className="font-medium">{h.diaSemana}</span> · {h.horaInicio} a {h.horaFin}
                  </span>
                  <Boton variante="secundario" onClick={() => setEdicion(h.idHorario)}>Editar</Boton>
                </li>
              )
            )}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-4 bg-crema p-5">
        <h3 className="font-serif text-2xl">Agregar horario</h3>
        <FormularioHorario
          key={propios.length}
          inicial={{ diaSemana: "Lunes", horaInicio: "", horaFin: "" }}
          textoBoton="Agregar horario"
          alGuardar={(datos) => registrarHorario(idCurso, datos)}
          alTerminar={() => alAvisar("Horario registrado")}
        />
      </div>
    </div>
  );
}

function FormularioHorario({
  inicial,
  textoBoton,
  alGuardar,
  alTerminar,
  alCancelar,
}: {
  inicial: DatosHorario;
  textoBoton: string;
  alGuardar: (datos: DatosHorario) => { ok: true } | { ok: false; error: string };
  alTerminar: () => void;
  alCancelar?: () => void;
}) {
  const [datos, setDatos] = useState<DatosHorario>({ diaSemana: inicial.diaSemana, horaInicio: inicial.horaInicio, horaFin: inicial.horaFin });
  const [error, setError] = useState<string | null>(null);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const resultado = alGuardar(datos);
    if (!resultado.ok) return setError(resultado.error);
    setError(null);
    alTerminar();
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Selector etiqueta="Día" value={datos.diaSemana} onChange={(e) => setDatos({ ...datos, diaSemana: e.target.value as DiaSemana })}>
          {DIAS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Selector>
        <Campo etiqueta="Inicio" type="time" value={datos.horaInicio} onChange={(e) => setDatos({ ...datos, horaInicio: e.target.value })} />
        <Campo etiqueta="Fin" type="time" value={datos.horaFin} onChange={(e) => setDatos({ ...datos, horaFin: e.target.value })} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3">
        {alCancelar && <Boton type="button" variante="secundario" onClick={alCancelar}>Cancelar</Boton>}
        <Boton type="submit">{textoBoton}</Boton>
      </div>
    </form>
  );
}