"use client";

import { ControlSesion } from "@/components/cuenta/control-sesion";
import { DetalleCursoProfesor } from "./detalle-curso-profesor";

// Protege la página del curso asignado: requiere sesión
export function CursoAsignadoProfesor({ idCurso }: { idCurso: number }) {
  return (
    <ControlSesion volver={`/panel/cursos/${idCurso}`}>
      {(sesion) => <DetalleCursoProfesor idCurso={idCurso} sesion={sesion} />}
    </ControlSesion>
  );
}