"use client";

import { useState, type FormEvent } from "react";
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
      <Campo
        etiqueta="Ruta de la imagen (opcional)"
        placeholder="/img/productos/nombre.jpg"
        value={datos.imagenUrl}
        onChange={cambiar("imagenUrl")}
      />

      {producto ? (
        <p className="text-xs text-gris">Las existencias no se editan aquí; se cambian con entradas y ajustes.</p>
      ) : (
        <p className="text-xs text-gris">El producto se registra activo y con 0 existencias. Las unidades se agregan con una entrada.</p>
      )}

      {errorGeneral && <p className="text-sm text-red-700">{errorGeneral}</p>}

      <div className="flex justify-end gap-3">
        <Boton type="button" variante="secundario" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit" disabled={procesando}>{procesando ? "Guardando..." : producto ? "Guardar cambios" : "Registrar producto"}</Boton>
      </div>
    </form>
  );
}