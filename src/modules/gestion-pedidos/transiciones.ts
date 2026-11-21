import type { EstadoOperativo, ModalidadEntrega } from "@/modules/ventas-pagos/schema";

// Transiciones permitidas del estado operativo según la modalidad (HU-09, RF-28).
// Las usa el frontend y debe usarlas el backend.
const SECUENCIAS: Record<ModalidadEntrega, EstadoOperativo[]> = {
  "Envío a domicilio": ["Pendiente", "En preparación", "Empacado", "Enviado"],
  "Retiro presencial": ["Pendiente", "En preparación", "Listo para retiro", "Retirado"],
};

// Siguiente estado válido, o null si el pedido ya está en su estado final
export function siguienteEstado(modalidad: ModalidadEntrega, actual: EstadoOperativo): EstadoOperativo | null {
  const secuencia = SECUENCIAS[modalidad];
  const posicion = secuencia.indexOf(actual);
  return posicion >= 0 && posicion < secuencia.length - 1 ? secuencia[posicion + 1] : null;
}

export function esEstadoFinal(modalidad: ModalidadEntrega, estado: EstadoOperativo): boolean {
  return siguienteEstado(modalidad, estado) === null;
}