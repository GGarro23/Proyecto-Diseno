import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Documento } from "@/components/ayuda/documento";

export const metadata: Metadata = { title: "Preguntas frecuentes · Intervallum" };

type Pregunta = { pregunta: string; respuesta: ReactNode };

const GRUPOS: { titulo: string; preguntas: Pregunta[] }[] = [
  {
    titulo: "Compras y pagos",
    preguntas: [
      {
        pregunta: "¿Cómo compro un instrumento?",
        respuesta: (
          <>
            Elige el producto en <Link href="/catalogo" className="text-naranja hover:underline">Instrumentos</Link>,
            agrégalo al carrito e inicia sesión. En el carrito revisas tu selección, eliges la entrega y confirmas el pago.
          </>
        ),
      },
      {
        pregunta: "¿Los pagos son reales?",
        respuesta:
          "No. Intervallum es un proyecto académico y el pago es simulado: no se solicitan datos de tarjeta ni se realiza ningún cobro.",
      },
      {
        pregunta: "¿Cuántas unidades puedo comprar?",
        respuesta: "Hasta 99 unidades de un mismo producto por pedido, siempre que haya existencias suficientes.",
      },
      {
        pregunta: "¿Qué pasa si el producto se agota mientras pago?",
        respuesta:
          "Las existencias se confirman en el momento del pago. Si otra persona compró las últimas unidades antes, el pago se rechaza por falta de existencias y no se registra la venta.",
      },
    ],
  },
  {
    titulo: "Entregas",
    preguntas: [
      {
        pregunta: "¿Qué opciones de entrega tienen?",
        respuesta:
          "Envío a domicilio, indicando provincia, cantón y dirección exacta, o retiro en nuestra tienda en Alajuela, de lunes a sábado de 9:00 a 18:00.",
      },
      {
        pregunta: "¿Cómo sé en qué estado está mi pedido?",
        respuesta: (
          <>
            Consulta <Link href="/mis-pedidos" className="text-naranja hover:underline">Mis pedidos</Link>. También te
            enviamos un correo cada vez que el pedido cambia de estado: en preparación, empacado, enviado o listo para
            retiro.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Academia",
    preguntas: [
      {
        pregunta: "¿Cómo me inscribo en un curso?",
        respuesta: (
          <>
            Inicia sesión, entra a la <Link href="/academia" className="text-naranja hover:underline">Academia</Link>,
            abre el curso y presiona «Inscribirme». El curso debe estar abierto y tener cupos disponibles.
          </>
        ),
      },
      {
        pregunta: "¿Por qué no puedo inscribirme?",
        respuesta:
          "Puede ser porque el curso está cerrado, no tiene cupos, ya estás inscrito o usas una cuenta del personal de Intervallum. Las inscripciones son para cuentas de clientes.",
      },
      {
        pregunta: "¿Dónde veo mis cursos y mi asistencia?",
        respuesta: "En «Mi panel» encuentras tus cursos, los horarios y el registro de asistencia de cada sesión.",
      },
    ],
  },
  {
    titulo: "Cuenta y seguridad",
    preguntas: [
      {
        pregunta: "¿Qué necesito para crear una cuenta?",
        respuesta:
          "Tu nombre y al menos un apellido, un correo electrónico y una contraseña de al menos 8 caracteres con letras y números. El teléfono y la provincia son opcionales.",
      },
      {
        pregunta: "¿Puedo cambiar mis datos?",
        respuesta: "Sí. En «Mi perfil» presiona «Editar información» para actualizar tu nombre, correo, teléfono o provincia.",
      },
      {
        pregunta: "¿Cómo protegen mi contraseña?",
        respuesta: "Tu contraseña se guarda cifrada y nunca se almacena ni se muestra en texto legible.",
      },
    ],
  },
];

export default function PreguntasFrecuentes() {
  return (
    <Documento
      ruta="/preguntas-frecuentes"
      titulo="Preguntas"
      destacado="frecuentes"
      introduccion={
        <>
          Reunimos las dudas más comunes sobre compras, entregas, cursos y cuentas. Si no encuentras tu respuesta,
          escríbenos por WhatsApp al <strong className="text-tinta">7293-0517</strong> o a{" "}
          <strong className="text-tinta">intervallum123@gmail.com</strong>.
        </>
      }
      secciones={GRUPOS.map((grupo) => ({
        titulo: grupo.titulo,
        contenido: (
          <div className="flex flex-col divide-y divide-borde rounded-md border border-borde bg-papel">
            {grupo.preguntas.map((item) => (
              <details key={item.pregunta} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-tinta">
                  {item.pregunta}
                  <span className="text-xl text-naranja transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gris">{item.respuesta}</p>
              </details>
            ))}
          </div>
        ),
      }))}
    />
  );
}
