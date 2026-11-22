import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { consultar, generar } from "@/modules/agente-apoyo/service";
import type { Recomendacion } from "@/modules/agente-apoyo/schema";

export function GET() {
  return manejar(async () => exito(await consultar()));
}

export function POST(peticion: Request) {
  return manejar(async () => {
    const { tipo } = await leerCuerpo<{ tipo: Recomendacion["tipo"] }>(peticion);
    return exito(await generar(tipo), 201);
  });
}
