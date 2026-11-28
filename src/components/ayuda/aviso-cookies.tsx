"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const CLAVE = "intervallum:aviso-cookies";
const EVENTO = "intervallum-aviso-cookies";

function suscribir(avisar: () => void) {
  window.addEventListener("storage", avisar);
  window.addEventListener(EVENTO, avisar);
  return () => {
    window.removeEventListener("storage", avisar);
    window.removeEventListener(EVENTO, avisar);
  };
}

function aceptado(): boolean {
  try {
    return window.localStorage.getItem(CLAVE) === "aceptado";
  } catch {
    return true;
  }
}

export function AvisoCookies() {
  const visto = useSyncExternalStore(suscribir, aceptado, () => true);

  if (visto) return null;

  const aceptar = () => {
    try {
      window.localStorage.setItem(CLAVE, "aceptado");
    } catch {}
    window.dispatchEvent(new Event(EVENTO));
  };

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed bottom-6 left-6 z-40 flex max-w-sm flex-col gap-4 rounded-md border border-borde bg-papel p-5 shadow-lg"
    >
      <p className="text-sm leading-relaxed text-gris">
        Usamos solo la cookie necesaria para mantener tu sesión iniciada. No usamos cookies de publicidad ni de analítica.{" "}
        <Link href="/cookies" className="text-naranja hover:underline">
          Más información
        </Link>
      </p>
      <button
        type="button"
        onClick={aceptar}
        className="self-end rounded-md bg-naranja px-5 py-2 text-sm font-medium text-papel transition hover:bg-naranja-oscuro hover:shadow-md"
      >
        Entendido
      </button>
    </div>
  );
}
