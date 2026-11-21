import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full border border-borde bg-white px-4 py-3 text-sm text-tinta outline-none focus:border-cafe aria-[invalid=true]:border-red-700";

type Envoltura = { etiqueta: string; error?: string; children: ReactNode };

function Envoltura({ etiqueta, error, children }: Envoltura) {
  return (
    <label className="flex flex-col gap-2 text-sm text-tinta">
      {etiqueta}
      {children}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </label>
  );
}

type Base = { etiqueta: string; error?: string };

export function Campo({ etiqueta, error, ...props }: Base & ComponentProps<"input">) {
  return (
    <Envoltura etiqueta={etiqueta} error={error}>
      <input className={control} aria-invalid={!!error} {...props} />
    </Envoltura>
  );
}

export function AreaTexto({ etiqueta, error, ...props }: Base & ComponentProps<"textarea">) {
  return (
    <Envoltura etiqueta={etiqueta} error={error}>
      <textarea className={`${control} min-h-24`} aria-invalid={!!error} {...props} />
    </Envoltura>
  );
}

export function Selector({ etiqueta, error, children, ...props }: Base & ComponentProps<"select">) {
  return (
    <Envoltura etiqueta={etiqueta} error={error}>
      <select className={control} aria-invalid={!!error} {...props}>
        {children}
      </select>
    </Envoltura>
  );
}