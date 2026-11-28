"use client";

import Link from "next/link";
import { useSesion } from "@/components/sesion/proveedor-sesion";

const CON_SESION = [
  { texto: "Mi panel", href: "/panel" },
  { texto: "Mi perfil", href: "/perfil" },
  { texto: "Mis pedidos", href: "/mis-pedidos" },
  { texto: "Carrito", href: "/carrito" },
];

const SIN_SESION = [
  { texto: "Iniciar sesión", href: "/iniciar-sesion" },
  { texto: "Crear cuenta", href: "/registro" },
  { texto: "Carrito", href: "/carrito" },
];

export function EnlacesCuenta() {
  const { sesion, cargando } = useSesion();
  const enlaces = cargando ? [] : sesion ? CON_SESION : SIN_SESION;

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {enlaces.map((enlace) => (
        <li key={enlace.href}>
          <Link href={enlace.href} className="transition-colors hover:text-papel">
            {enlace.texto}
          </Link>
        </li>
      ))}
    </ul>
  );
}