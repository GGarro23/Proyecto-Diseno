import { PROVINCIAS } from "@/lib/provincias";
import { LETRAS, espacios, texto } from "@/lib/validacion";

export const CANTIDAD_MAXIMA_LINEA = 99;
export const LIMITES_ENTREGA = { canton: 60, direccion: 200, direccionCompleta: 300 };

export type DatosEntrega = {
  modalidad: "Envío a domicilio" | "Retiro presencial" | null;
  provincia: string;
  canton: string;
  direccion: string;
};

export type ErroresEntrega = Partial<Record<keyof DatosEntrega, string>>;

export function validarEntrega(entrega: DatosEntrega): ErroresEntrega {
  const errores: ErroresEntrega = {};
  if (entrega.modalidad !== "Envío a domicilio" && entrega.modalidad !== "Retiro presencial") {
    errores.modalidad = "Selecciona una modalidad de entrega.";
    return errores;
  }
  if (entrega.modalidad === "Retiro presencial") return errores;
  if (!PROVINCIAS.includes(entrega.provincia)) errores.provincia = "Selecciona una provincia válida.";
  const errorCanton = texto(espacios(entrega.canton), "el cantón", {
    min: 3,
    max: LIMITES_ENTREGA.canton,
    patron: LETRAS,
    mensajePatron: "El cantón solo puede tener letras y espacios.",
  });
  if (errorCanton) errores.canton = errorCanton;
  const errorDireccion = texto(espacios(entrega.direccion), "la dirección exacta", { min: 10, max: LIMITES_ENTREGA.direccion });
  if (errorDireccion) errores.direccion = errorDireccion;
  else if (!/\p{L}/u.test(entrega.direccion)) errores.direccion = "La dirección debe incluir señas en texto, no solo números.";
  return errores;
}

export function validarCantidadCarrito(cantidad: number, existencias: number): string | undefined {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) return "La cantidad debe ser un entero positivo.";
  if (cantidad > CANTIDAD_MAXIMA_LINEA) return `Puedes llevar como máximo ${CANTIDAD_MAXIMA_LINEA} unidades de un mismo producto.`;
  if (cantidad > existencias) return `Solo hay ${existencias} unidades disponibles.`;
}
