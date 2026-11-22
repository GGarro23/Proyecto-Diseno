
import { BotonEnlace } from "@/components/ui/boton";
import { Sobretitulo } from "@/components/ui/textos";

export function ConfirmacionCompra({
  idPedido,
  correo,
}: {
  idPedido: number;
  correo: string;
}) {
  return (
    <div className="flex flex-col items-center gap-5 border border-borde bg-papel px-8 py-14 text-center">
      <span
        className="flex size-16 items-center justify-center rounded-full bg-naranja-claro text-2xl text-naranja"
        aria-hidden="true"
      >
        ✓
      </span>

      <Sobretitulo>
        Pedido N.º {idPedido}
      </Sobretitulo>

      <h2 className="font-serif text-4xl">
        ¡Tu compra fue confirmada!
      </h2>

      <p className="max-w-md text-gris">
        Tu pedido se registró correctamente y el pago
        simulado fue aprobado. Puedes consultar su
        progreso en la sección &quot;Mis pedidos&quot;.
      </p>

      <p className="max-w-md text-sm text-gris">
        Correo asociado a tu cuenta: {correo}.
        Las notificaciones por correo dependen de la
        configuración del servicio de envío.
      </p>

      <BotonEnlace href="/mis-pedidos">
        Ver mis pedidos
      </BotonEnlace>

      <BotonEnlace href="/">
        Volver al inicio
      </BotonEnlace>
    </div>
  );
}
