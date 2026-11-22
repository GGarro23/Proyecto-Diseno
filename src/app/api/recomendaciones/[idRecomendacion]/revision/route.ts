import { exito, manejar } from "@/lib/respuesta";
import { marcarRevisada } from "@/modules/agente-apoyo/service";

// POST /api/recomendaciones/{idRecomendacion}/revision   Marcar como Revisada       RF-48
// Requiere el permiso agente.usar. Responde 409 si ya estaba revisada.

export function POST(_: Request, { params }: { params: Promise<{ idRecomendacion: string }> }) {
  return manejar(async () => {
    const { idRecomendacion } = await params;
    return exito(await marcarRevisada(Number(idRecomendacion)));
  });
}
