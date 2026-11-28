"use client";

import { useEffect, useState } from "react";

const FOTOS = [
  { src: "/img/inicio/presentacion-1.jpg", alt: "Instrumentos de la tienda Intervallum" },
  { src: "/img/inicio/presentacion-2.jpg", alt: "Instrumentos de la tienda Intervallum" },
  { src: "/img/inicio/presentacion-3.jpg", alt: "Instrumentos de la tienda Intervallum" },
];

const INTERVALO = 5000;

export function GaleriaPresentacion({ className = "" }: { className?: string }) {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    const temporizador = setInterval(() => {
      setActual((indice) => (indice + 1) % FOTOS.length);
    }, INTERVALO);

    return () => clearInterval(temporizador);
  }, [actual]);

  return (
    <div className={`overflow-hidden bg-borde ${className}`}>
      {FOTOS.map((foto, indice) => (
        <div
          key={foto.src}
          role="img"
          aria-label={foto.alt}
          aria-hidden={indice !== actual}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            indice === actual ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url('${foto.src}')` }}
        />
      ))}

      <div className="absolute bottom-4 right-4 flex gap-2">
        {FOTOS.map((foto, indice) => (
          <button
            key={foto.src}
            type="button"
            aria-label={`Ver imagen ${indice + 1} de ${FOTOS.length}`}
            aria-current={indice === actual}
            onClick={() => setActual(indice)}
            className={`size-2.5 rounded-full transition-colors ${
              indice === actual ? "bg-papel" : "bg-papel/50 hover:bg-papel/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
