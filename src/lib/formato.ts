const colones = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

export function formatearColones(monto: number): string {
  return colones.format(monto);
}

const ZONA_HORARIA = "America/Costa_Rica";

const partesFecha = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function instanteConZona(valor: string): Date | null {
  const limpio = valor.trim();
  if (!/(z|[+-]\d{2}(:?\d{2})?)$/i.test(limpio) || !/\d{2}:\d{2}/.test(limpio)) return null;
  const fecha = new Date(limpio.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function formatearFechaHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  const fecha = instanteConZona(valor);
  if (!fecha) return valor.slice(0, 16).replace("T", " ");
  const partes = Object.fromEntries(partesFecha.formatToParts(fecha).map((p) => [p.type, p.value]));
  return `${partes.year}-${partes.month}-${partes.day} ${partes.hour}:${partes.minute}`;
}

export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  return formatearFechaHora(valor).slice(0, 10);
}
