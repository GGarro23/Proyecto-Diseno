"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "@/components/ui/icono";

// Secciones de administración. Se agregan aquí a medida que existan.
const SECCIONES: { href: string; texto: string; icono: NombreIcono }[] = [
  { href: "/admin", texto: "Resumen", icono: "grafico" },
  { href: "/admin/inventario", texto: "Inventario", icono: "caja" },
  { href: "/admin/pedidos", texto: "Pedidos", icono: "lista" },
];

// Barra lateral del Administrador (Figura 31)
export function BarraAdmin() {
  const ruta = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-cafe-oscuro text-papel">
      <div className="flex items-center gap-3 border-b border-papel/15 p-6">
        <span className="flex size-10 items-center justify-center rounded-full border border-papel/40 font-serif">IV</span>
        <div>
          <p className="font-serif text-lg leading-none">Administración</p>
          <p className="mt-1 text-[10px] tracking-[0.2em] text-papel/60">INTERVALLUM</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {SECCIONES.map((s) => {
          const activa = s.href === "/admin" ? ruta === "/admin" : ruta.startsWith(s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`flex items-center gap-3 border-l-2 px-4 py-3 text-sm ${
                activa ? "border-naranja bg-papel/10" : "border-transparent text-papel/75 hover:bg-papel/5"
              }`}
            >
              <Icono nombre={s.icono} className="size-5" />
              {s.texto}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}