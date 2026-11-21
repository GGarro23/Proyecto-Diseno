"use client";

import { useState, type ReactNode } from "react";
import { useCarrito } from "@/components/carrito/proveedor-carrito";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Pasos } from "@/components/ui/pasos";
import { Sobretitulo } from "@/components/ui/textos";
import { COSTO_ENTREGA, crearPedido, simularPago } from "@/mocks/compra";
import { ConfirmacionCompra } from "./confirmacion-compra";
import { EntregaCompra, type DatosEntrega } from "./entrega-compra";
import { PagoCompra } from "./pago-compra";
import { RevisionCompra } from "./revision-compra";
import { ResumenCompra } from "./resumen-compra";

const TITULOS = ["Tu selección", "¿Cómo lo recibes?", "Pago simulado", "Orden confirmada"];

// Flujo de compra en cuatro pasos (Figuras 13–16, CU-09, HU-07)
export function FlujoCompra() {
  const { sesion } = useSesion();
  const { lineas, vaciar } = useCarrito();
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [entrega, setEntrega] = useState<DatosEntrega>({ modalidad: null, provincia: "San José", canton: "", direccion: "" });
  const [erroresEntrega, setErroresEntrega] = useState<Partial<Record<keyof DatosEntrega, string>>>({});
  const [idPedido, setIdPedido] = useState<number | null>(null);
  const [codigo, setCodigo] = useState("");
  const [errorPago, setErrorPago] = useState<string>();

  const encabezado = (
    <div className="mb-10 flex flex-col items-center gap-3 text-center">
      <Sobretitulo>Compra segura · Simulación académica</Sobretitulo>
      <h1 className="font-serif text-5xl">{TITULOS[paso - 1]}</h1>
      <div className="mt-6 w-full">
        <Pasos actual={paso} />
      </div>
    </div>
  );

  if (!sesion) {
    return (
      <Mensaje encabezado={encabezado} texto="Inicia sesión para revisar tu carrito y completar la compra.">
        <BotonEnlace href="/iniciar-sesion?volver=/carrito">Iniciar sesión</BotonEnlace>
      </Mensaje>
    );
  }

  if (paso === 4 && idPedido) {
    return (
      <div>
        {encabezado}
        <div className="mx-auto max-w-3xl">
          <ConfirmacionCompra idPedido={idPedido} correo={sesion.usuario.correo} />
        </div>
      </div>
    );
  }

  if (lineas.length === 0) {
    return (
      <Mensaje encabezado={encabezado} texto="Tu carrito está vacío.">
        <BotonEnlace href="/catalogo">Explorar instrumentos</BotonEnlace>
      </Mensaje>
    );
  }

  // RF-24: validar la entrega y registrar el pedido pendiente (RF-23)
  const continuarEntrega = () => {
    const errores: typeof erroresEntrega = {};
    if (!entrega.modalidad) errores.modalidad = "Selecciona una modalidad de entrega.";
    if (entrega.modalidad === "Envío a domicilio") {
      if (!entrega.canton.trim()) errores.canton = "Indica el cantón.";
      if (!entrega.direccion.trim()) errores.direccion = "Indica la dirección exacta.";
    }
    setErroresEntrega(errores);
    if (Object.keys(errores).length > 0 || !entrega.modalidad) return;

    const direccion =
      entrega.modalidad === "Envío a domicilio"
        ? `${entrega.provincia}, ${entrega.canton.trim()}. ${entrega.direccion.trim()}`
        : null;
    const resultado = crearPedido(sesion.usuario.idUsuario, lineas, entrega.modalidad, direccion);
    if (!resultado.ok) return setErroresEntrega({ modalidad: resultado.error });
    setIdPedido(resultado.dato.idPedido);
    setPaso(3);
  };

  // RF-25: simular el pago del pedido pendiente
  const pagar = () => {
    if (!idPedido) return;
    const resultado = simularPago(idPedido, codigo);
    if (!resultado.ok) return setErrorPago(resultado.error);
    vaciar();
    setPaso(4);
  };

  const costoEntrega = entrega.modalidad && paso > 1 ? COSTO_ENTREGA[entrega.modalidad] : null;

  return (
    <div>
      {encabezado}
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="border border-borde bg-papel p-7">
          {paso === 1 && <RevisionCompra />}
          {paso === 2 && <EntregaCompra datos={entrega} errores={erroresEntrega} alCambiar={setEntrega} />}
          {paso === 3 && <PagoCompra codigo={codigo} error={errorPago} alCambiar={setCodigo} />}
        </section>

        <ResumenCompra lineas={lineas} costoEntrega={costoEntrega}>
          {paso === 1 && <Boton onClick={() => setPaso(2)}>Continuar</Boton>}
          {paso === 2 && <Boton onClick={continuarEntrega}>Continuar</Boton>}
          {paso === 3 && <Boton onClick={pagar}>Simular pago</Boton>}
          {paso > 1 && (
            <button onClick={() => setPaso(paso === 3 ? 2 : 1)} className="text-sm text-gris hover:text-naranja">
              Volver al paso anterior
            </button>
          )}
        </ResumenCompra>
      </div>
    </div>
  );
}

function Mensaje({ encabezado, texto, children }: { encabezado: ReactNode; texto: string; children: ReactNode }) {
  return (
    <div>
      {encabezado}
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 border border-borde bg-papel p-12 text-center">
        <p className="text-gris">{texto}</p>
        {children}
      </div>
    </div>
  );
}