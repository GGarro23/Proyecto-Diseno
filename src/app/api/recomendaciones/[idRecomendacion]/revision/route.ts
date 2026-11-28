import { exito, leerId, manejar } from "@/lib/respuesta";
import { marcarRevisada } from "@/modules/agente-apoyo/service";

export function POST(_: Request, { params }: { params: Promise<{ idRecomendacion: string }> }) {
  return manejar(async () => {
    const { idRecomendacion } = await params;
    return exito(await marcarRevisada(leerId(idRecomendacion, "Recomendación inválida.")));
  });
}
