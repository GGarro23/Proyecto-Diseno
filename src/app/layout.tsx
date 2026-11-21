import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Encabezado } from "@/components/layout/encabezado";
import { sesion } from "@/mocks/sesion";
import "./globals.css";
import { ProveedorCarrito } from "@/components/carrito/proveedor-carrito";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Intervallum",
  description: "Tienda y academia musical",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${cormorant.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ProveedorCarrito sesionActiva={!!sesion}>
          <Encabezado sesion={sesion} />
          <main className="flex-1">{children}</main>
        </ProveedorCarrito>
      </body>
    </html>
  );
}