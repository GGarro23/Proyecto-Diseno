"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";

type CategoriaReal = {
  idCategoria: number;
  nombre: string;
  totalProductos: number;
};

type Edicion = {
  idCategoria: number;
  nombre: string;
  error?: string;
};

function mensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

async function solicitarCategorias<T>(
  metodo: "GET" | "POST" | "PUT",
  datos?: object
): Promise<T> {
  const respuesta = await fetch("/api/categorias", {
    method: metodo,
    headers: datos
      ? { "Content-Type": "application/json" }
      : undefined,
    body: datos ? JSON.stringify(datos) : undefined,
    cache: "no-store",
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok || !resultado.ok) {
    throw new Error(
      resultado.error ??
        "No fue posible realizar la operación."
    );
  }

  return resultado.dato as T;
}

export function CategoriasAdmin({
  alTerminar,
}: {
  alTerminar: (texto: string) => void;
}) {
  const [categorias, setCategorias] = useState<
    CategoriaReal[]
  >([]);

  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<
    string | undefined
  >();

  const [edicion, setEdicion] = useState<
    Edicion | null
  >(null);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [errorCarga, setErrorCarga] = useState<
    string | null
  >(null);

  const recargar = useCallback(async () => {
    const datos =
      await solicitarCategorias<CategoriaReal[]>("GET");

    setCategorias(datos);
    setErrorCarga(null);
  }, []);

  useEffect(() => {
    void recargar()
      .catch((error) => {
        setErrorCarga(mensajeError(error));
      })
      .finally(() => {
        setCargando(false);
      });
  }, [recargar]);

  const registrar = async (e: FormEvent) => {
    e.preventDefault();

    if (procesando) return;

    setProcesando(true);
    setError(undefined);

    try {
      const categoria =
        await solicitarCategorias<CategoriaReal>(
          "POST",
          { nombre }
        );

      setNombre("");

      alTerminar(
        `Categoría registrada: ${categoria.nombre}`
      );

      await recargar();
    } catch (error) {
      setError(mensajeError(error));
    } finally {
      setProcesando(false);
    }
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();

    if (!edicion || procesando) return;

    setProcesando(true);

    try {
      const categoria =
        await solicitarCategorias<CategoriaReal>(
          "PUT",
          {
            idCategoria: edicion.idCategoria,
            nombre: edicion.nombre,
          }
        );

      setEdicion(null);

      alTerminar(
        `Categoría actualizada: ${categoria.nombre}`
      );

      await recargar();
    } catch (error) {
      setEdicion((actual) =>
        actual
          ? {
              ...actual,
              error: mensajeError(error),
            }
          : null
      );
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <section className="border border-borde bg-papel">
        {errorCarga && (
          <div
            role="alert"
            className="border-b border-borde p-5 text-sm text-red-700"
          >
            <p>{errorCarga}</p>

            <button
              type="button"
              className="mt-2 underline"
              onClick={() => {
                setCargando(true);

                void recargar()
                  .catch((error) => {
                    setErrorCarga(mensajeError(error));
                  })
                  .finally(() => {
                    setCargando(false);
                  });
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
            <tr>
              <th className="px-5 py-3 font-medium">
                Categoría
              </th>

              <th className="px-5 py-3 text-right font-medium">
                Productos
              </th>

              <th className="px-5 py-3 text-right font-medium">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {cargando && (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-8 text-center text-gris"
                >
                  Cargando categorías...
                </td>
              </tr>
            )}

            {!cargando &&
              categorias.length === 0 &&
              !errorCarga && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-gris"
                  >
                    No hay categorías registradas.
                  </td>
                </tr>
              )}

            {categorias.map((categoria) => {
              const editando =
                edicion?.idCategoria ===
                categoria.idCategoria;

              return (
                <tr
                  key={categoria.idCategoria}
                  className="border-t border-borde align-middle"
                >
                  <td className="px-5 py-4">
                    {editando && edicion ? (
                      <form
                        id={`categoria-${categoria.idCategoria}`}
                        onSubmit={guardar}
                        noValidate
                      >
                        <Campo
                          etiqueta="Nombre"
                          value={edicion.nombre}
                          onChange={(e) =>
                            setEdicion({
                              ...edicion,
                              nombre: e.target.value,
                              error: undefined,
                            })
                          }
                          error={edicion.error}
                          autoFocus
                        />
                      </form>
                    ) : (
                      <span className="font-serif text-lg">
                        {categoria.nombre}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {categoria.totalProductos}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {editando ? (
                      <div className="flex justify-end gap-2">
                        <Boton
                          type="button"
                          variante="secundario"
                          disabled={procesando}
                          onClick={() => setEdicion(null)}
                        >
                          Cancelar
                        </Boton>

                        <Boton
                          type="submit"
                          form={`categoria-${categoria.idCategoria}`}
                          disabled={procesando}
                        >
                          {procesando
                            ? "Guardando..."
                            : "Guardar"}
                        </Boton>
                      </div>
                    ) : (
                      <Boton
                        variante="secundario"
                        disabled={procesando}
                        onClick={() =>
                          setEdicion({
                            idCategoria:
                              categoria.idCategoria,
                            nombre: categoria.nombre,
                          })
                        }
                      >
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

      <form
        onSubmit={registrar}
        noValidate
        className="flex h-fit flex-col gap-5 border border-borde bg-papel p-7"
      >
        <h2 className="font-serif text-3xl">
          Nueva categoría
        </h2>

        <Campo
          etiqueta="Nombre"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setError(undefined);
          }}
          error={error}
        />

        <Boton
          type="submit"
          disabled={procesando}
        >
          {procesando
            ? "Registrando..."
            : "Registrar categoría"}
        </Boton>
      </form>
    </div>
  );
}
