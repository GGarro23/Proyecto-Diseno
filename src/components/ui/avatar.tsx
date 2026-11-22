export function Avatar({ nombre, grande = false }: { nombre: string; grande?: boolean }) {
  const iniciales = nombre.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-serif ${
        grande ? "size-20 bg-cafe text-2xl text-papel" : "size-11 bg-naranja-claro text-sm text-cafe"
      }`}
    >
      {iniciales}
    </span>
  );
}   