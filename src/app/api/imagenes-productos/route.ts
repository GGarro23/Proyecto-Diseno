import { NextResponse } from "next/server";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ErrorApi, exito, manejar } from "@/lib/respuesta";
import { requerirPermiso } from "@/modules/autenticacion-usuarios/service";

const carpeta = path.join(process.cwd(), "public", "imagenes", "productos");
const base = "/imagenes/productos/";
const extensiones: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const maximo = 5 * 1024 * 1024;

export function GET() {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");
    const archivos = await readdir(carpeta).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [] as string[];
      throw error;
    });
    return exito(archivos
      .filter((nombre) => /\.(jpe?g|png|webp)$/i.test(nombre))
      .sort((a, b) => a.localeCompare(b))
      .map((nombre) => base + encodeURIComponent(nombre)));
  });
}

// Subida para el entorno local de desarrollo. En un despliegue sin disco
// persistente habrá que sustituirla por Supabase Storage (u otro object storage).
export function POST(peticion: Request) {
  return manejar(async () => {
    await requerirPermiso("catalogo.administrar");
    const formulario = await peticion.formData().catch(() => {
      throw new ErrorApi(400, "Selecciona una imagen válida.");
    });
    const archivo = formulario.get("imagen");
    if (!(archivo instanceof File)) throw new ErrorApi(400, "Selecciona una imagen.");
    const extension = extensiones[archivo.type];
    if (!extension) throw new ErrorApi(400, "Solo se aceptan imágenes JPG, PNG o WebP.");
    if (!archivo.size || archivo.size > maximo) {
      throw new ErrorApi(400, "La imagen debe pesar menos de 5 MB.");
    }
    const bytes = Buffer.from(await archivo.arrayBuffer());
    // Validar firmas para no confiar solamente en el MIME declarado.
    const esJpeg = extension === ".jpg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const esPng = extension === ".png" && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const esWebp = extension === ".webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!(esJpeg || esPng || esWebp)) throw new ErrorApi(400, "El archivo no es una imagen válida.");
    const nombre = `${randomUUID()}${extension}`;
    try {
      await mkdir(carpeta, { recursive: true });
      await writeFile(path.join(carpeta, nombre), bytes, { flag: "wx" });
    } catch (error) {
      console.error("No se pudo almacenar la imagen:", error);
      throw new ErrorApi(503, "El servidor no permite guardar imágenes en este entorno. Usa una imagen existente.");
    }
    return exito({ imagenUrl: base + nombre }, 201);
  });
}
