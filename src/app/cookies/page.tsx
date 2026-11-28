import type { Metadata } from "next";
import { Documento } from "@/components/ayuda/documento";

export const metadata: Metadata = { title: "Política de cookies · Intervallum" };

const ALMACENAMIENTO = [
  {
    nombre: "intervallum-sesion",
    tipo: "Cookie necesaria",
    finalidad: "Mantiene tu sesión iniciada. Está firmada y protegida, y no puede leerse desde el navegador.",
    duracion: "8 horas o hasta que cierres sesión",
  },
  {
    nombre: "intervallum:aviso-cookies",
    tipo: "Almacenamiento local",
    finalidad: "Recuerda que ya viste el aviso de cookies para no mostrarlo de nuevo.",
    duracion: "Hasta que borres los datos del navegador",
  },
  {
    nombre: "intervallum:pedido-pendiente",
    tipo: "Almacenamiento de sesión",
    finalidad: "Recuerda un pedido pendiente de pago para que puedas retomarlo en el carrito.",
    duracion: "Hasta que cierres la pestaña",
  },
];

export default function Cookies() {
  return (
    <Documento
      ruta="/cookies"
      titulo="Política de"
      destacado="cookies"
      actualizado="27 de noviembre de 2026"
      introduccion="Las cookies son pequeños archivos que un sitio guarda en tu navegador. Intervallum solo usa lo indispensable para funcionar: no usamos cookies de publicidad, analítica ni de terceros."
      secciones={[
        {
          titulo: "Qué guardamos en tu navegador",
          contenido: (
            <div className="overflow-x-auto rounded-md border border-borde bg-papel">
              <table className="w-full text-sm">
                <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Finalidad</th>
                    <th className="px-4 py-3 font-medium">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {ALMACENAMIENTO.map((fila) => (
                    <tr key={fila.nombre} className="border-t border-borde align-top">
                      <td className="px-4 py-3 font-mono text-xs text-tinta">{fila.nombre}</td>
                      <td className="px-4 py-3">{fila.tipo}</td>
                      <td className="px-4 py-3">{fila.finalidad}</td>
                      <td className="px-4 py-3">{fila.duracion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
        {
          titulo: "Por qué no pedimos tu consentimiento",
          contenido: (
            <p>
              Todo lo que guardamos es estrictamente necesario para iniciar sesión y completar compras. Por eso solo te
              mostramos un aviso informativo: si bloqueas la cookie de sesión no podrás iniciar sesión, comprar ni inscribirte.
            </p>
          ),
        },
        {
          titulo: "Cómo eliminarlas",
          contenido: (
            <p>
              Al cerrar sesión se borra la cookie de sesión. También puedes eliminar las cookies y los datos del sitio desde la
              configuración de privacidad de tu navegador en cualquier momento.
            </p>
          ),
        },
      ]}
    />
  );
}
