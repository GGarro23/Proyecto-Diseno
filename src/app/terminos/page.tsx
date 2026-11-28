import type { Metadata } from "next";
import Link from "next/link";
import { Documento } from "@/components/ayuda/documento";

export const metadata: Metadata = { title: "Términos y condiciones · Intervallum" };

const SOFTWARE = [
  { nombre: "Next.js y React", licencia: "MIT" },
  { nombre: "Tailwind CSS", licencia: "MIT" },
  { nombre: "node-postgres (pg)", licencia: "MIT" },
  { nombre: "bcryptjs", licencia: "BSD-3-Clause" },
  { nombre: "Nodemailer", licencia: "MIT-0" },
  { nombre: "TypeScript", licencia: "Apache-2.0" },
  { nombre: "Fuentes Cormorant Garamond e Inter", licencia: "SIL Open Font License 1.1" },
];

export default function Terminos() {
  return (
    <Documento
      ruta="/terminos"
      titulo="Términos y"
      destacado="condiciones"
      actualizado="27 de noviembre de 2026"
      introduccion={
        <>
          Estos términos regulan el uso del sitio de Intervallum, tienda y academia musical. Al crear una cuenta, comprar o
          inscribirte en un curso aceptas estas condiciones. Intervallum es un proyecto académico del curso Diseño de
          Software del Instituto Tecnológico de Costa Rica.
        </>
      }
      secciones={[
        {
          titulo: "Naturaleza académica del sitio",
          contenido: (
            <p>
              El sitio se desarrolló con fines educativos. Los pagos son <strong>simulados</strong>: no se solicitan datos de
              tarjeta, no se realizan cobros reales y los pedidos no generan obligaciones de entrega comercial.
            </p>
          ),
        },
        {
          titulo: "Cuentas",
          contenido: (
            <ul>
              <li>Debes registrar datos verdaderos y mantener tu contraseña en reserva.</li>
              <li>Eres responsable de las operaciones realizadas con tu cuenta.</li>
              <li>Intervallum puede desactivar cuentas que se usen de forma indebida.</li>
            </ul>
          ),
        },
        {
          titulo: "Compras, precios y existencias",
          contenido: (
            <ul>
              <li>Los precios se muestran en colones costarricenses.</li>
              <li>Puedes llevar hasta 99 unidades de un mismo producto por pedido.</li>
              <li>Las existencias se confirman al momento del pago. Si un producto se agota antes, el pago se rechaza.</li>
              <li>Puedes elegir envío a domicilio o retiro en la tienda en Alajuela, de lunes a sábado de 9:00 a 18:00.</li>
            </ul>
          ),
        },
        {
          titulo: "Academia",
          contenido: (
            <ul>
              <li>La inscripción depende de que el curso esté abierto y tenga cupos disponibles.</li>
              <li>Las inscripciones están disponibles para cuentas de clientes.</li>
              <li>Los horarios y la asignación de profesores pueden cambiar; los cambios se publican en la academia.</li>
            </ul>
          ),
        },
        {
          titulo: "Uso aceptable",
          contenido: (
            <p>
              No está permitido intentar acceder a cuentas o secciones sin autorización, alterar el funcionamiento del sitio ni
              usarlo para fines distintos de los descritos.
            </p>
          ),
        },
        {
          titulo: "Propiedad intelectual y licencias",
          contenido: (
            <>
              <p>
                El diseño, los textos y el código del sitio pertenecen al equipo de Intervallum. Las imágenes de productos,
                cursos e instalaciones se usan con fines ilustrativos y académicos, y pertenecen a sus respectivos autores.
              </p>
              <p>El sitio utiliza software de código abierto bajo las siguientes licencias:</p>
              <ul>
                {SOFTWARE.map((item) => (
                  <li key={item.nombre}>
                    <strong>{item.nombre}:</strong> {item.licencia}
                  </li>
                ))}
              </ul>
            </>
          ),
        },
        {
          titulo: "Privacidad",
          contenido: (
            <p>
              El tratamiento de tus datos se describe en la{" "}
              <Link href="/privacidad" className="text-naranja hover:underline">política de privacidad</Link> y en la{" "}
              <Link href="/cookies" className="text-naranja hover:underline">política de cookies</Link>.
            </p>
          ),
        },
        {
          titulo: "Cambios y contacto",
          contenido: (
            <p>
              Podemos actualizar estos términos; la fecha de la última versión aparece al inicio de esta página. Si tienes
              dudas, escríbenos a <strong>intervallum123@gmail.com</strong> o por WhatsApp al <strong>7293-0517</strong>.
              Estos términos se rigen por las leyes de la República de Costa Rica.
            </p>
          ),
        },
      ]}
    />
  );
}
