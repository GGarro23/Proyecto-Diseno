"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { llamarApi, type Resultado } from "@/lib/api";
import {
  LIMITES_CATALOGO,
  SIMBOLOS,
  validarCategoria,
  type DatosCategoria,
  type ErroresCategoria,
} from "@/modules/catalogo-inventario/validaciones";

type CategoriaReal = {
  idCategoria: number;
  nombre: string;
  descripcion: string;
  simbolo: string;
  totalProductos: number;
};

const VACIA: DatosCategoria = { nombre: "", descripcion: "", simbolo: "" };

const pedirCategorias = () => llamarApi<CategoriaReal[]>("/api/categorias");

export function CategoriasAdmin({ alTerminar }: { alTerminar: (texto: string) => void }) {
  const [categorias, setCategorias] = useState<CategoriaReal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [idEdicion, setIdEdicion] = useState<number | null>(null);
  const [datos, setDatos] = useState<DatosCategoria>(VACIA);
  const [errores, setErrores] = useState<ErroresCategoria>({});
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const aplicar = useCallback((resultado: Resultado<CategoriaReal[]>) => {
    if (resultado.ok) {
      setCategorias(resultado.dato);
      setErrorCarga(null);
    } else {
      setErrorCarga(resultado.error);
    }
    setCargando(false);
  }, []);

  const recargar = useCallback(async () => {
    setCargando(true);
    aplicar(await pedirCategorias());
  }, [aplicar]);

  useEffect(() => {
    let vigente = true;
    pedirCategorias().then((resultado) => {
      if (vigente) aplicar(resultado);
    });
    return () => {
      vigente = false;
    };
  }, [aplicar]);

  const cambiar = (campo: keyof DatosCategoria, valor: string) => {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
    setError(null);
  };

  const editar = (categoria: CategoriaReal) => {
    setIdEdicion(categoria.idCategoria);
    setDatos({ nombre: categoria.nombre, descripcion: categoria.descripcion, simbolo: categoria.simbolo });
    setErrores({});
    setError(null);
  };

  const cancelar = () => {
    setIdEdicion(null);
    setDatos(VACIA);
    setErrores({});
    setError(null);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (procesando) return;
    const encontrados = validarCategoria(datos, categorias, idEdicion ?? undefined);
    if (Object.keys(encontrados).length > 0) return setErrores(encontrados);
    setProcesando(true);
    const resultado =
      idEdicion === null
        ? await llamarApi<CategoriaReal>("/api/categorias", "POST", datos)
        : await llamarApi<CategoriaReal>("/api/categorias", "PUT", { idCategoria: idEdicion, ...datos });
    setProcesando(false);
    if (!resultado.ok) {
      setErrores(resultado.errores ?? {});
      return setError(resultado.errores ? null : resultado.error);
    }
    alTerminar(`${idEdicion === null ? "Categoría registrada" : "Categoría actualizada"}: ${resultado.dato.nombre}`);
    cancelar();
    await recargar();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <section className="border border-borde bg-papel">
        {errorCarga && (
          <div role="alert" className="border-b border-borde p-5 text-sm text-red-700">
            <p>{errorCarga}</p>
            <button type="button" className="mt-2 underline" onClick={() => void recargar()}>
              Reintentar
            </button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-crema text-left text-xs uppercase tracking-wider text-gris">
            <tr>
              <th className="px-5 py-3 font-medium">Símbolo</th>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 text-right font-medium">Productos</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && categorias.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gris">Cargando categorías...</td>
              </tr>
            )}
            {!cargando && categorias.length === 0 && !errorCarga && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gris">No hay categorías registradas.</td>
              </tr>
            )}
            {categorias.map((categoria) => (
              <tr
                key={categoria.idCategoria}
                className={`border-t border-borde align-middle ${idEdicion === categoria.idCategoria ? "bg-naranja-claro/40" : ""}`}
              >
                <td className="px-5 py-4 text-2xl text-naranja">{categoria.simbolo}</td>
                <td className="px-5 py-4">
                  <p className="font-serif text-lg">{categoria.nombre}</p>
                  <p className="text-xs text-gris">{categoria.descripcion || "Sin descripción"}</p>
                </td>
                <td className="px-5 py-4 text-right">{categoria.totalProductos}</td>
                <td className="px-5 py-4 text-right">
                  <Boton variante="secundario" disabled={procesando} onClick={() => editar(categoria)} className="rounded-md">
                    Editar
                  </Boton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <form onSubmit={enviar} noValidate className="flex h-fit flex-col gap-5 border border-borde bg-papel p-7">
        <h2 className="font-serif text-3xl">{idEdicion === null ? "Nueva categoría" : "Editar categoría"}</h2>

        <Campo
          etiqueta="Nombre"
          value={datos.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          error={errores.nombre}
          maxLength={LIMITES_CATALOGO.nombreCategoria}
        />

        <div className="flex flex-col gap-1">
          <Campo
            etiqueta="Descripción"
            value={datos.descripcion}
            onChange={(e) => cambiar("descripcion", e.target.value)}
            error={errores.descripcion}
            maxLength={LIMITES_CATALOGO.descripcionCategoria}
            placeholder="Ejemplo: Violines, violas y guitarras"
          />
          <span className="self-end text-xs text-gris">
            {datos.descripcion.length}/{LIMITES_CATALOGO.descripcionCategoria}
          </span>
        </div>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-2">Símbolo</legend>
          <div className="grid grid-cols-4 gap-2">
            {SIMBOLOS.map((simbolo) => (
              <button
                key={simbolo}
                type="button"
                onClick={() => cambiar("simbolo", simbolo)}
                aria-pressed={datos.simbolo === simbolo}
                aria-label={`Símbolo ${simbolo}`}
                className={`rounded-md border py-2 text-2xl transition ${
                  datos.simbolo === simbolo ? "border-naranja bg-naranja-claro text-naranja" : "border-borde text-tinta hover:border-cafe"
                }`}
              >
                {simbolo}
              </button>
            ))}
          </div>
          {errores.simbolo && <span className="text-xs text-red-700">{errores.simbolo}</span>}
        </fieldset>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex gap-3">
          {idEdicion !== null && (
            <Boton type="button" variante="secundario" onClick={cancelar} disabled={procesando} className="flex-1 rounded-md">
              Cancelar
            </Boton>
          )}
          <Boton type="submit" disabled={procesando} className="flex-1 rounded-md">
            {procesando ? "Guardando..." : idEdicion === null ? "Registrar categoría" : "Guardar cambios"}
          </Boton>
        </div>
      </form>
    </div>
  );
}
