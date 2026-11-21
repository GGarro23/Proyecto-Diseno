"use client";

import { ControlSesion } from "@/components/cuenta/control-sesion";
import { DetalleCursoProfesor } from "./detalle-curso-profesor";

export function CursoAsignadoProfesor({ idCurso }: { idCurso: number }) {
  return (
    <ControlSesion volver={`/panel/cursos/${idCurso}`}>
      {(sesion) => <DetalleCursoProfesor idCurso={idCurso} sesion={sesion} />}
    </ControlSesion>
  );
}