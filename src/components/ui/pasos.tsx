// Indicador de pasos de la compra (Figuras 13–16)
const PASOS = ["Revisar", "Entrega", "Pago", "Confirmación"];

export function Pasos({ actual }: { actual: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mx-auto flex w-full max-w-3xl items-center">
      {PASOS.map((nombre, i) => {
        const numero = i + 1;
        const completado = numero < actual;
        const activo = numero === actual;
        return (
          <li key={nombre} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${
                activo
                  ? "bg-naranja text-papel"
                  : completado
                    ? "bg-cafe text-papel"
                    : "border border-borde text-gris"
              }`}
            >
              {completado ? "✓" : numero}
            </span>
            <span className={`text-xs ${activo ? "font-medium text-tinta" : "text-gris"}`}>{nombre}</span>
            {numero < PASOS.length && <span className="mx-2 h-px flex-1 bg-borde" />}
          </li>
        );
      })}
    </ol>
  );
}