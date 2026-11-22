export function Foto({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`bg-borde bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url('${src}')` }}
    />
  );
}