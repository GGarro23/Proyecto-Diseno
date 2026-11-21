// Formato de precios de los prototipos: ₡489 000
const colones = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

export function formatearColones(monto: number): string {
  return colones.format(monto);
}
