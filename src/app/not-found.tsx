import { BotonEnlace } from "@/components/ui/boton";
import { Sobretitulo } from "@/components/ui/textos";

export default function NoEncontrada() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-6 py-24 text-center">
      <Sobretitulo>Error 404</Sobretitulo>
      <h1 className="font-serif text-5xl">
        Página no <em className="text-naranja">encontrada</em>
      </h1>
      <p className="text-sm text-gris">
        La sección que busca todavía no existe o fue movida.
      </p>
      <BotonEnlace href="/">Volver al inicio</BotonEnlace>
    </div>
  );
}