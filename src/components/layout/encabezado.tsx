"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useCarrito } from "@/components/carrito/proveedor-carrito";
import { useSesion } from "@/components/sesion/proveedor-sesion";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-full border border-cafe font-serif text-lg text-cafe">
        IV
      </span>
      <span className="flex flex-col items-center leading-none">
        <span className="font-serif text-xl tracking-[0.25em] text-tinta">INTERVALLUM</span>
        <span className="mt-1 text-[10px] tracking-[0.3em] text-naranja">TIENDA · ACADEMIA</span>
      </span>
    </Link>
  );
}

const iconos = {
  buscar: "M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
  usuario: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  bolsa: "M6 8h12l-1 13H7L6 8zm3 0V6a3 3 0 0 1 6 0v2",
};

function Icono({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Roles que tienen panel propio (Figuras 22, 23, 28 y 31). El Cliente no tiene panel.
const ROLES_CON_PANEL = ["Estudiante", "Profesor", "Encargado de pedidos", "Administrador", "Administrador del sistema"];

export function Encabezado() {
  const ruta = usePathname();
  const { sesion } = useSesion();
  const tienePanel = !!sesion?.roles.some((r) => ROLES_CON_PANEL.includes(r));
  const { cantidadTotal } = useCarrito();
  // false en el servidor y en el primer dibujo; true ya en el navegador.
  // Evita que el número del carrito (guardado en el navegador) cause un error de hidratación.
  const montado = useSyncExternalStore(() => () => {}, () => true, () => false);

  const enlaces = sesion
    ? [
        { href: "/catalogo", texto: "Instrumentos" },
        { href: "/academia", texto: "Academia" },
        ...(tienePanel ? [{ href: "/panel", texto: "Mi panel" }] : []),
        { href: "/perfil", texto: "Mi perfil" },
        { href: "/nosotros", texto: "Nosotros" },
      ]
    : [
        { href: "/catalogo", texto: "Instrumentos" },
        { href: "/academia", texto: "Academia" },
        { href: "/iniciar-sesion", texto: "Iniciar sesión" },
        { href: "/nosotros", texto: "Nosotros" },
      ];

  return (
    <header className="border-b border-borde bg-crema">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="flex items-center gap-10">
          <ul className="flex gap-8 text-sm text-gris">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className={`border-b py-7 hover:text-tinta ${
                    ruta.startsWith(e.href) ? "border-naranja text-tinta" : "border-transparent"
                  }`}
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-5 text-tinta">
            <Link href="/catalogo" aria-label="Buscar"><Icono d={iconos.buscar} /></Link>
            <Link href={sesion ? "/perfil" : "/iniciar-sesion"} aria-label="Cuenta"><Icono d={iconos.usuario} /></Link>
            <Link href="/carrito" aria-label="Carrito" className="relative">
              <Icono d={iconos.bolsa} />
              {montado && cantidadTotal > 0 && (
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-naranja text-[10px] text-papel">
                  {cantidadTotal}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}