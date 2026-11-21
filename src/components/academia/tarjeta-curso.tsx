import { BotonEnlace } from "@/components/ui/boton";
import { Foto } from "@/components/ui/foto";
import { Icono } from "@/components/ui/icono";
import type { Curso, Horario } from "@/modules/academia/schema";
import { EstadoCurso } from "./estado-curso";

type Props = {
  curso: Curso;
  horarios: Horario[];
  profesor?: string;
  cuposDisponibles: number;
};

export function TarjetaCurso({ curso, horarios, profesor, cuposDisponibles }: Props) {
  return (
    <article className="flex flex-col border border-borde bg-papel">
      <Foto src={curso.imagenUrl} alt={curso.nombre} className="h-48" />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <EstadoCurso
          curso={curso}
          cuposDisponibles={cuposDisponibles}
          />
        <h3 className="font-serif text-2xl">{curso.nombre}</h3>
        {profesor && <p className="text-sm text-gris">con {profesor}</p>}
        <p className="line-clamp-2 text-sm text-gris">{curso.descripcion}</p>
        <ul className="flex flex-col gap-1 border-t border-borde pt-3 text-sm">
          {horarios.map((h) => (
            <li key={h.idHorario} className="flex items-center gap-2">
              <Icono nombre="calendario" className="size-4 text-naranja" />
              {h.diaSemana} · {h.horaInicio}–{h.horaFin}
            </li>
          ))}
        </ul>
        <BotonEnlace href={`/academia/${curso.idCurso}`} className="mt-auto">
          Ver curso
        </BotonEnlace>
      </div>
    </article>
  );
}