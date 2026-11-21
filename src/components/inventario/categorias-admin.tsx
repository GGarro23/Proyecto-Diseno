"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { modificarCategoria, registrarCategoria } from "@/mocks/inventario";
import type { Categoria, Producto } from "@/modules/catalogo-inventario/schema";

// Registro y modificación de categorías (RF-11, RF-12). Sin prototipo en el documento.
export function CategoriasAdmin({
  categorias,
  productos,
  alTerminar,
}: {
  categorias: Categoria[];
  productos: Producto[];
  alTerminar: (texto: string) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [edicion, setEdicion] = useState<{ idCategoria: number; nombre: string; error?: string } | null>(null);

  const registrar = (e: FormEvent) => {
    e.preventDefault();
    const resultado = registrarCategoria(nombre);
    if (!resultado.ok) return setError(resultado.error);
    setNombre("");
    setError(undefined);
    alTerminar(`Categoría registrada: ${resultado.dato.nombre}`);
  };

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    if (!edicion) return;
    const resultado = modificarCategoria(edicion.idCategoria, edicion.nombre);
    if (!resultado.ok) return setEdicion({ ...edicion, error: resultado.error });
    setEdicion(null);
    alTerminar(`Categoría actualizada: ${resultado.dato.nombre}`);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <section className="border border-borde bg-papel">
        <table className="w-full text-sm">
          <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
            <tr>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 text-right font-medium">Productos</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => {
              const total = productos.filter((p) => p.idCategoria === c.idCategoria).length;
              const editando = edicion?.idCategoria === c.idCategoria;
              return (
                <tr key={c.idCategoria} className="border-t border-borde align-middle">
                  <td className="px-5 py-4">
                    {editando ? (
                      <form id={`categoria-${c.idCategoria}`} onSubmit={guardar} noValidate>
                        <Campo
                          etiqueta="Nombre"
                          value={edicion.nombre}
                          onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
                          error={edicion.error}
                          autoFocus
                        />
                      </form>
                    ) : (
                      <span className="font-serif text-lg">{c.nombre}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">{total}</td>
                  <td className="px-5 py-4 text-right">
                    {editando ? (
                      <div className="flex justify-end gap-2">
                        <Boton type="button" variante="secundario" onClick={() => setEdicion(null)}>Cancelar</Boton>
                        <Boton type="submit" form={`categoria-${c.idCategoria}`}>Guardar</Boton>
                      </div>
                    ) : (
                      <Boton variante="secundario" onClick={() => setEdicion({ idCategoria: c.idCategoria, nombre: c.nombre })}>
                        Editar
                      </Boton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <form onSubmit={registrar} noValidate className="flex h-fit flex-col gap-5 border border-borde bg-papel p-7">
        <h2 className="font-serif text-3xl">Nueva categoría</h2>
        <Campo etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} error={error} />
        <Boton type="submit">Registrar categoría</Boton>
      </form>
    </div>
  );
}