"use client";

import { RequiereSesion } from "@/components/cuenta/requiere-sesion";
import { DetalleCursoProfesor } from "./detalle-curso-profesor";

// Protege la página del curso asignado: requiere sesión
export function CursoAsignado({ idCurso }: { idCurso: number }) {
  return (
    <RequiereSesion volver={`/panel/cursos/${idCurso}`}>
      {(sesion) => <DetalleCursoProfesor idCurso={idCurso} sesion={sesion} />}
    </RequiereSesion>
  );
}