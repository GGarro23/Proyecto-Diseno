export type Mensaje = string | undefined;

export const LETRAS = /^[\p{L}][\p{L}\s'.-]*$/u;
export const CORREO = /^(?!.*\.\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
export const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
export const FECHA = /^\d{4}-\d{2}-\d{2}$/;
export const RUTA_IMAGEN = /^(\/[A-Za-z0-9._~%-]+)+\.(jpe?g|png|webp)$/i;
export const URL_IMAGEN = /^https:\/\/[^\s/$.?#][^\s]*\.(jpe?g|png|webp)(\?[^\s]*)?$/i;

export function aTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export function espacios(texto: string): string {
  return texto.trim().replace(/\s+/g, " ");
}

export function texto(
  valor: string,
  etiqueta: string,
  opciones: { min?: number; max: number; requerido?: boolean; patron?: RegExp; mensajePatron?: string }
): Mensaje {
  const limpio = valor.trim();
  const { min = 1, max, requerido = true, patron, mensajePatron } = opciones;
  if (!limpio) return requerido ? `Indica ${etiqueta}.` : undefined;
  if (limpio.length < min) return `${mayuscula(etiqueta)} debe tener al menos ${min} caracteres.`;
  if (limpio.length > max) return `${mayuscula(etiqueta)} no puede superar los ${max} caracteres.`;
  if (patron && !patron.test(limpio)) return mensajePatron ?? `${mayuscula(etiqueta)} tiene caracteres no permitidos.`;
}

export function entero(valor: string, etiqueta: string, min: number, max: number): Mensaje {
  const limpio = valor.trim();
  if (!limpio) return `Indica ${etiqueta}.`;
  if (!/^-?\d+$/.test(limpio)) return `${mayuscula(etiqueta)} debe ser un número entero.`;
  const numero = Number(limpio);
  if (numero < min) return `${mayuscula(etiqueta)} debe ser de al menos ${formatear(min)}.`;
  if (numero > max) return `${mayuscula(etiqueta)} no puede ser mayor que ${formatear(max)}.`;
}

export function monto(valor: string, etiqueta: string, min: number, max: number): Mensaje {
  const limpio = valor.trim();
  if (!limpio) return `Indica ${etiqueta}.`;
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return `${mayuscula(etiqueta)} debe ser un número con máximo dos decimales.`;
  const numero = Number(limpio);
  if (numero < min) return `${mayuscula(etiqueta)} debe ser de al menos ₡${formatear(min)}.`;
  if (numero > max) return `${mayuscula(etiqueta)} no puede superar ₡${formatear(max)}.`;
}

export function opcion<T extends string>(valor: string, lista: readonly T[], mensaje: string): Mensaje {
  if (!lista.includes(valor as T)) return mensaje;
}

export function fechaReal(valor: string): boolean {
  if (!FECHA.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return Number.isFinite(fecha.valueOf()) && fecha.toISOString().slice(0, 10) === valor;
}

export function rutaImagen(valor: string, requerido = false): Mensaje {
  const limpio = valor.trim();
  if (!limpio) return requerido ? "Selecciona una imagen." : undefined;
  if (limpio.length > 500) return "La ruta de la imagen no puede superar los 500 caracteres.";
  if (!RUTA_IMAGEN.test(limpio) && !URL_IMAGEN.test(limpio)) {
    return "La imagen debe ser una ruta del sitio o una dirección https que termine en .jpg, .png o .webp.";
  }
}

export function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function mayuscula(etiqueta: string): string {
  return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
}

function formatear(numero: number): string {
  return numero.toLocaleString("es-CR");
}
