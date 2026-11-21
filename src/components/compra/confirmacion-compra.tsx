import { BotonEnlace } from "@/components/ui/boton";
import { Sobretitulo } from "@/components/ui/textos";

// Paso 4: pedido confirmado (Figura 16)
export function PasoConfirmacion({ idPedido, correo }: { idPedido: number; correo: string }) {
  return (
    <div className="flex flex-col items-center gap-5 border border-borde bg-papel px-8 py-14 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-naranja-claro text-2xl text-naranja">✓</span>
      <Sobretitulo>Pedido N.º {idPedido}</Sobretitulo>
      <h2 className="font-serif text-4xl">Todo listo. La música está en camino.</h2>
      <p className="max-w-md text-gris">
        Enviamos la confirmación a {correo}. Podrás consultar el progreso en &quot;Mis pedidos&quot;.
      </p>
      <BotonEnlace href="/">Volver al inicio</BotonEnlace>
    </div>
  );
}