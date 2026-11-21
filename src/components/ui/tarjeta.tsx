import type { ComponentProps } from "react";

export function Tarjeta({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`border border-borde bg-papel p-8 ${className}`} {...props} />;
}