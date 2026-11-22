import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { consultar, generar } from "@/modules/agente-apoyo/service";
import type { Recomendacion } from "@/modules/agente-apoyo/schema";

// GET  /api/recomendaciones   Recomendaciones con producto o curso y revisor          RF-47
// POST /api/recomendaciones   Pedir al agente que genere { tipo }                      RF-45, RF-46
//      tipo: "Reabastecimiento" | "Promoción académica". Responde { creadas }.
// Requieren el permiso agente.usar.

export function GET() {
  return manejar(async () => exito(await consultar()));
}

export function POST(peticion: Request) {
  return manejar(async () => {
    const { tipo } = await leerCuerpo<{ tipo: Recomendacion["tipo"] }>(peticion);
    return exito(await generar(tipo), 201);
  });
}
