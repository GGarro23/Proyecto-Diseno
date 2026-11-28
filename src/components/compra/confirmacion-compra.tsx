"use client";

import { useEffect, useState } from "react";
import { BotonEnlace } from "@/components/ui/boton";
import { Icono } from "@/components/ui/icono";
import { Sobretitulo } from "@/components/ui/textos";
import { apiDetallePedido, type DetallePedidoGestion } from "@/lib/api-pedidos";
import { formatearColones, formatearFecha } from "@/lib/formato";

const PASOS_ENVIO = ["Preparamos tu pedido", "Lo empacamos con cuidado", "Sale hacia tu dirección"];
const PASOS_RETIRO = ["Preparamos tu pedido", "Te avisamos cuando esté listo", "Lo retiras en la tienda"];

export function ConfirmacionCompra({ idPedido, correo }: { idPedido: number; correo: string }) {
  const [detalle, setDetalle] = useState<DetallePedidoGestion | null>(null);

  useEffect(() => {
    let vigente = true;
    apiDetallePedido(idPedido).then((resultado) => {
      if (vigente && resultado.ok) setDetalle(resultado.dato);
    });
    return () => {
      vigente = false;
    };
  }, [idPedido]);

  const envio = detalle?.modalidadEntrega === "ENVIO";
  const pasos = envio ? PASOS_ENVIO : PASOS_RETIRO;

  return (
    <div className="flex flex-col gap-8 border border-borde bg-papel px-8 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-naranja text-2xl text-papel" aria-hidden>
          ✓
        </span>
        <Sobretitulo>Pedido N.º {idPedido}</Sobretitulo>
        <h2 className="font-serif text-4xl">
          ¡Gracias por tu <em className="text-naranja">compra</em>!
        </h2>
        <p className="max-w-md text-gris">
          Tu pago fue aprobado y tu pedido ya está en nuestras manos. Te enviaremos un correo a{" "}
          <span className="font-medium text-tinta">{correo}</span> cada vez que avance.
        </p>
      </div>

      {detalle && (
        <div className="grid gap-6 border-y border-borde py-6 sm:grid-cols-[1fr_14rem]">
          <div>
            <p className="text-xs uppercase tracking-wider text-gris">Resumen</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {detalle.productos.map((producto) => (
                <li key={producto.idProducto} className="flex justify-between gap-4">
                  <span>
                    {producto.nombre} <span className="text-gris">× {producto.cantidad}</span>
                  </span>
                  <span className="tabular-nums">{formatearColones(Number(producto.subtotal))}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between border-t border-borde pt-3 font-medium">
              <span>Total pagado</span>
              <span className="text-lg font-bold tabular-nums text-naranja">{formatearColones(Number(detalle.total))}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-gris">Entrega</p>
            <p className="font-medium">{envio ? "Envío a domicilio" : "Retiro en la tienda"}</p>
            <p className="text-gris">{envio ? detalle.direccionEntrega : "Alajuela, Costa Rica · Lunes a sábado de 9:00 a 18:00"}</p>
            <p className="text-xs text-gris">Fecha del pedido: {formatearFecha(detalle.fechaCreacion)}</p>
          </div>
        </div>
      )}

      <ol className="grid gap-3 sm:grid-cols-3">
        {pasos.map((paso, indice) => (
          <li key={paso} className="flex items-center gap-3 rounded-md bg-crema px-4 py-3 text-sm">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-naranja text-xs text-naranja">
              {indice + 1}
            </span>
            {paso}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap justify-center gap-3">
        <BotonEnlace href="/mis-pedidos" className="rounded-md hover:shadow-md">
          Ver mis pedidos
        </BotonEnlace>
        <BotonEnlace href="/catalogo" variante="secundario" className="rounded-md hover:shadow-md">
          Seguir comprando <Icono nombre="flecha" />
        </BotonEnlace>
      </div>
    </div>
  );
}
