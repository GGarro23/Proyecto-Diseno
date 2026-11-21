// Íconos de línea usados en los prototipos
const trazos = {
  flecha: "M5 12h14M13 6l6 6-6 6",
  flechaIzquierda: "M19 12H5M11 6l-6 6 6 6",
  bolsa: "M6 8h12l-1 13H7L6 8zm3 0V6a3 3 0 0 1 6 0v2",
  buscar: "M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
  mas: "M12 5v14M5 12h14",
  menos: "M5 12h14",
  calendario: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  persona: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  cerrar: "M6 6l12 12M18 6L6 18",
  grafico: "M4 20h16M7 16v-5M12 16V8M17 16v-8",
  caja: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18M4 7.5l8 4.5 8-4.5",
  lista: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  libro: "M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5zm0 15a2 2 0 0 0 2 2h13v-4",
  foco: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z",
  subir: "M12 15V4M7 9l5-5 5 5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4",
};

export type NombreIcono = keyof typeof trazos;

export function Icono({ nombre, className = "size-4" }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d={trazos[nombre]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}