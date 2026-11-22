import { Suspense } from "react";
import { ListadoCatalogo } from "@/components/catalogo/listado-catalogo";
import { Sobretitulo } from "@/components/ui/textos";
import {
  obtenerProductos,
  obtenerCategorias,
} from "@/modules/catalogo-inventario/consultas";

async function CatalogoDesdeBD() {
  const [productos, categorias] = await Promise.all([
    obtenerProductos(),
    obtenerCategorias(),
  ]);

  return (
    <ListadoCatalogo
      productos={productos}
      categorias={categorias}
    />
  );
}

export default function Catalogo() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 text-center">
        <Sobretitulo>Tienda Intervallum</Sobretitulo>

        <h1 className="mt-3 font-serif text-5xl">
          Instrumentos para tu{" "}
          <em className="text-naranja">historia</em>
        </h1>

        <p className="mt-3 text-gris">
          Una colección seleccionada por músicos, para músicos.
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-center text-gris">
            Cargando instrumentos...
          </p>
        }
      >
        <CatalogoDesdeBD />
      </Suspense>
    </div>
  );
}
