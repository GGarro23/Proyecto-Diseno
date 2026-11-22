"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Selector } from "@/components/ui/campo";
import type { Categoria, Producto } from "@/modules/catalogo-inventario/schema";
import type { DatosProducto, ErroresProducto } from "@/modules/catalogo-inventario/validaciones";

// Registro y modificación de productos (RF-13, RF-14). Sin prototipo en el documento.
export function FormularioProductoAdmin({
  producto,
  categorias,
  alTerminar,
  alCancelar,
}: {
  producto: Producto | null;
  categorias: Categoria[];
  alTerminar: (texto: string) => void;
  alCancelar: () => void;
}) {
  const [datos, setDatos] = useState<DatosProducto>({
    codigo: producto?.codigo ?? "",
    nombre: producto?.nombre ?? "",
    idCategoria: producto ? String(producto.idCategoria) : "",
    precio: producto ? String(producto.precio) : "",
    descripcion: producto?.descripcion ?? "",
    imagenUrl: producto?.imagenUrl ?? "",
  });
  const [errores, setErrores] = useState<ErroresProducto>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [biblioteca, setBiblioteca] = useState<string[]>([]);
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const archivoRef = useRef<HTMLInputElement>(null);

  const cargarBiblioteca = async () => {
    try {
      const respuesta = await fetch("/api/imagenes-productos", { cache: "no-store" });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) throw new Error(resultado.error ?? "No se pudieron cargar las imágenes.");
      setBiblioteca(resultado.dato);
      setErrorImagen(null);
    } catch (error) {
      setErrorImagen(error instanceof Error ? error.message : "No se pudo cargar la biblioteca.");
    }
  };

  useEffect(() => {
    void cargarBiblioteca();
  }, []);

  const subirImagen = async (archivo?: File) => {
    if (!archivo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
      setErrorImagen("Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.");
      return;
    }
    setSubiendo(true);
    setErrorImagen(null);
    try {
      const cuerpo = new FormData();
      cuerpo.append("imagen", archivo);
      const respuesta = await fetch("/api/imagenes-productos", { method: "POST", body: cuerpo });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) throw new Error(resultado.error ?? "No se pudo subir la imagen.");
      setDatos((actual) => ({ ...actual, imagenUrl: resultado.dato.imagenUrl }));
      await cargarBiblioteca();
    } catch (error) {
      setErrorImagen(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
      if (archivoRef.current) archivoRef.current.value = "";
    }
  };

  const archivoElegido = (evento: ChangeEvent<HTMLInputElement>) => {
    void subirImagen(evento.target.files?.[0]);
  };

  const imagenSoltada = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    setArrastrando(false);
    void subirImagen(evento.dataTransfer.files?.[0]);
  };

  const cambiar = (campo: keyof DatosProducto) => (e: { target: { value: string } }) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (procesando) return;
    setProcesando(true);
    setErrores({});
    setErrorGeneral(null);
    try {
      const respuesta = await fetch("/api/productos", {
        method: producto ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, ...(producto ? { idProducto: producto.idProducto } : {}) }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.ok) {
        setErrores(resultado.errores ?? {});
        setErrorGeneral(resultado.error ?? "No se pudo guardar el producto.");
        return;
      }
      alTerminar(producto
        ? `Producto actualizado: ${resultado.dato.nombre}`
        : `Producto registrado: ${resultado.dato.nombre}`);
    } catch {
      setErrorGeneral("No fue posible conectar con el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Código" value={datos.codigo} onChange={cambiar("codigo")} error={errores.codigo} />
        <Selector etiqueta="Categoría" value={datos.idCategoria} onChange={cambiar("idCategoria")} error={errores.idCategoria}>
          <option value="">Selecciona una categoría</option>
          {categorias.map((c) => (
            <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
          ))}
        </Selector>
      </div>
      <Campo etiqueta="Nombre" value={datos.nombre} onChange={cambiar("nombre")} error={errores.nombre} />
      <Campo etiqueta="Precio (₡)" type="number" min={0} value={datos.precio} onChange={cambiar("precio")} error={errores.precio} />
      <AreaTexto etiqueta="Descripción" value={datos.descripcion} onChange={cambiar("descripcion")} error={errores.descripcion} />
      <section className="flex flex-col gap-3 text-sm">
        <span>Imagen del producto (opcional)</span>
        <div
          onDragOver={(evento) => { evento.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={imagenSoltada}
          className={`border-2 border-dashed p-6 text-center ${arrastrando ? "border-cafe bg-crema" : "border-borde bg-white"}`}
        >
          <p className="mb-3 text-gris">
            {subiendo ? "Subiendo imagen..." : "Arrastrá una imagen aquí o elegí un archivo"}
          </p>
          <input
            ref={archivoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Seleccionar imagen del producto"
            onChange={archivoElegido}
          />
          <div className="flex flex-wrap justify-center gap-2">
            <Boton type="button" variante="secundario" disabled={subiendo} onClick={() => archivoRef.current?.click()}>
              Elegir archivo
            </Boton>
            <Boton type="button" variante="secundario" onClick={() => setMostrarBiblioteca((valor) => !valor)}>
              {mostrarBiblioteca ? "Ocultar imágenes" : "Ver imágenes existentes"}
            </Boton>
          </div>
          <p className="mt-3 text-xs text-gris">JPG, PNG o WebP, máximo 5 MB.</p>
        </div>
        {mostrarBiblioteca && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {biblioteca.length === 0 && <p className="col-span-full text-gris">No hay imágenes disponibles.</p>}
            {biblioteca.map((ruta) => (
              <button
                type="button"
                key={ruta}
                aria-label={`Seleccionar ${ruta.split("/").pop()}`}
                aria-pressed={datos.imagenUrl === ruta}
                onClick={() => setDatos((actual) => ({ ...actual, imagenUrl: ruta }))}
                className={`flex flex-col gap-2 border p-2 text-left ${datos.imagenUrl === ruta ? "border-cafe bg-crema" : "border-borde"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ruta} alt="" className="h-24 w-full object-contain" />
                <span className="break-all text-xs">{decodeURIComponent(ruta.split("/").pop() ?? "")}</span>
              </button>
            ))}
          </div>
        )}
        {datos.imagenUrl && (
          <div className="flex items-center gap-4 border border-borde p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={datos.imagenUrl} alt="Vista previa del producto" className="size-24 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Imagen seleccionada</p>
              <p className="break-all text-xs text-gris">{datos.imagenUrl}</p>
              <button type="button" className="mt-2 text-xs underline" onClick={() => setDatos((actual) => ({ ...actual, imagenUrl: "" }))}>Quitar imagen</button>
            </div>
          </div>
        )}
        <Campo etiqueta="O ingresá una ruta o URL de imagen" placeholder="/imagenes/productos/nombre.jpg" value={datos.imagenUrl} onChange={cambiar("imagenUrl")} />
        {errorImagen && <p role="alert" className="text-sm text-red-700">{errorImagen}</p>}
      </section>

      {producto ? (
        <p className="text-xs text-gris">Las existencias no se editan aquí; se cambian con entradas y ajustes.</p>
      ) : (
        <p className="text-xs text-gris">El producto se registra activo y con 0 existencias. Las unidades se agregan con una entrada.</p>
      )}

      {errorGeneral && <p className="text-sm text-red-700">{errorGeneral}</p>}

      <div className="flex justify-end gap-3">
        <Boton type="button" variante="secundario" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit" disabled={procesando || subiendo}>{procesando ? "Guardando..." : producto ? "Guardar cambios" : "Registrar producto"}</Boton>
      </div>
    </form>
  );
}