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
};

export type NombreIcono = keyof typeof trazos;

export function Icono({ nombre, className = "size-4" }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d={trazos[nombre]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}