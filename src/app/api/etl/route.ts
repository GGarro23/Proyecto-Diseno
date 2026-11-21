import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { consultar, ejecutar } from "@/modules/etl/service";

export function GET() {
  return manejar(async () => exito(await consultar()));
}

export function POST(peticion: Request) {
  return manejar(async () => {
    const { nombreArchivo, contenido } = await leerCuerpo<{ nombreArchivo: string; contenido: string }>(peticion);
    return exito(await ejecutar(nombreArchivo, contenido), 201);
  });
}
