import Link from "next/link";
import type { ComponentProps } from "react";

type Variante = "primario" | "secundario" | "enlace";

const estilos: Record<Variante, string> = {
  primario:
    "bg-cafe text-papel hover:bg-cafe-oscuro disabled:bg-borde disabled:text-gris",
  secundario:
    "border border-borde bg-papel text-tinta hover:border-cafe disabled:text-gris",
  enlace: "text-tinta underline-offset-8 hover:underline",
};

const base =
  "inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed";

type BotonProps = ComponentProps<"button"> & { variante?: Variante };

export function Boton({ variante = "primario", className = "", ...props }: BotonProps) {
  return <button className={`${base} ${estilos[variante]} ${className}`} {...props} />;
}

type BotonEnlaceProps = ComponentProps<typeof Link> & { variante?: Variante };

export function BotonEnlace({ variante = "primario", className = "", ...props }: BotonEnlaceProps) {
  return <Link className={`${base} ${estilos[variante]} ${className}`} {...props} />;
}