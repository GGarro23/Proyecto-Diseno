import { exito, leerCuerpo, manejar } from "@/lib/respuesta";
import { consultar, ejecutar } from "@/modules/etl/service";

// GET  /api/etl   Historial de ejecuciones y sus errores                              RF-50
// POST /api/etl   Ejecutar importación { nombreArchivo, contenido }                   RF-49
//      contenido: texto del CSV. Responde { idEjecucion, estado, filasAceptadas, filasRechazadas }.
// Requieren el permiso etl.ejecutar.

export function GET() {
  return manejar(async () => exito(await consultar()));
}

export function POST(peticion: Request) {
  return manejar(async () => {
    const { nombreArchivo, contenido } = await leerCuerpo<{ nombreArchivo: string; contenido: string }>(peticion);
    return exito(await ejecutar(nombreArchivo, contenido), 201);
  });
}
