import type { Metadata } from "next";
import Link from "next/link";
import { Documento } from "@/components/ayuda/documento";

export const metadata: Metadata = { title: "Política de privacidad · Intervallum" };

export default function Privacidad() {
  return (
    <Documento
      ruta="/privacidad"
      titulo="Política de"
      destacado="privacidad"
      actualizado="27 de noviembre de 2026"
      introduccion={
        <>
          Intervallum es un proyecto académico del curso Diseño de Software del Instituto Tecnológico de Costa Rica. Esta
          política explica qué datos personales recopilamos, para qué los usamos y cómo puedes ejercer tus derechos según la
          Ley N.º 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales.
        </>
      }
      secciones={[
        {
          titulo: "Datos que recopilamos",
          contenido: (
            <ul>
              <li><strong>Cuenta:</strong> nombre completo, correo electrónico y contraseña, que se guarda cifrada.</li>
              <li><strong>Datos opcionales:</strong> teléfono y provincia, si decides indicarlos en tu perfil.</li>
              <li><strong>Compras:</strong> productos, cantidades, modalidad de entrega y dirección de envío cuando la eliges.</li>
              <li><strong>Academia:</strong> cursos en los que te inscribes y el registro de asistencia.</li>
            </ul>
          ),
        },
        {
          titulo: "Para qué los usamos",
          contenido: (
            <ul>
              <li>Crear y proteger tu cuenta y mantener tu sesión iniciada.</li>
              <li>Procesar tus pedidos, coordinar la entrega y avisarte por correo cada cambio de estado.</li>
              <li>Gestionar tus inscripciones, horarios y asistencia en la academia.</li>
              <li>Generar reportes internos de ventas, inventario y ocupación de cursos.</li>
            </ul>
          ),
        },
        {
          titulo: "Con quién los compartimos",
          contenido: (
            <p>
              No vendemos ni cedemos tus datos. Solo los usan los servicios necesarios para que el sitio funcione: la base de
              datos donde se almacenan y el servicio de correo que envía las notificaciones de tus pedidos e inscripciones.
            </p>
          ),
        },
        {
          titulo: "Cómo los protegemos",
          contenido: (
            <ul>
              <li>Las contraseñas se guardan cifradas y nunca en texto legible.</li>
              <li>La sesión usa una cookie protegida que no puede leerse desde el navegador.</li>
              <li>Cada operación verifica en el servidor que tengas permiso para realizarla.</li>
            </ul>
          ),
        },
        {
          titulo: "Tus derechos",
          contenido: (
            <>
              <p>
                Puedes solicitar el acceso a tus datos, su rectificación o su eliminación. Para corregir tu nombre, correo,
                teléfono o provincia usa «Mi perfil». Para cualquier otra solicitud escríbenos a{" "}
                <strong>intervallum123@gmail.com</strong>.
              </p>
              <p>
                Si consideras que tus derechos no fueron atendidos, puedes acudir a la Agencia de Protección de Datos de los
                Habitantes (Prodhab).
              </p>
            </>
          ),
        },
        {
          titulo: "Cookies",
          contenido: (
            <p>
              Usamos solo la cookie necesaria para mantener tu sesión. Consulta el detalle en la{" "}
              <Link href="/cookies" className="text-naranja hover:underline">política de cookies</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
