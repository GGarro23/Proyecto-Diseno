export type Resultado<T> = { ok: true; dato: T } | { ok: false; error: string; errores?: Record<string, string> };

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function llamarApi<T>(ruta: string, metodo: Metodo = "GET", cuerpo?: unknown): Promise<Resultado<T>> {
  try {
    const respuesta = await fetch(ruta, {
      method: metodo,
      headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      cache: "no-store",
    });
    return (await respuesta.json()) as Resultado<T>;
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo." };
  }
}