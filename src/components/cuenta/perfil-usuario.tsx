"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCarrito } from "@/components/carrito/proveedor-carrito";
import { useSesion } from "@/components/sesion/proveedor-sesion";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campo";
import { Insignia, Sobretitulo } from "@/components/ui/textos";
import { PROVINCIAS } from "@/lib/provincias";
import type { Sesion } from "@/modules/autenticacion-usuarios/schema";
import { validarDatosCuenta, type ErroresCuenta } from "@/modules/autenticacion-usuarios/validaciones";

export function PerfilUsuario({ sesion }: { sesion: Sesion }) {
  const { actualizarPerfil, cerrarSesion } = useSesion();
  const { vaciar } = useCarrito();
  const router = useRouter();
  const { usuario, roles } = sesion;
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState({ nombre: usuario.nombre, correo: usuario.correo, telefono: usuario.telefono, provincia: usuario.provincia });
  const [errores, setErrores] = useState<ErroresCuenta>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const iniciales = usuario.nombre.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const cambiar = (campo: keyof typeof datos, valor: string) => setDatos({ ...datos, [campo]: valor });

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setAviso(null);
    const encontrados = validarDatosCuenta(datos);
    if (Object.keys(encontrados).length > 0) return setErrores(encontrados);
    const sinCambios =
      datos.nombre.trim() === usuario.nombre && datos.correo.trim().toLowerCase() === usuario.correo &&
      datos.telefono.trim() === usuario.telefono && datos.provincia === usuario.provincia;
    if (sinCambios) {
      setErrores({});
      setEditando(false);
      return setAviso("No hiciste cambios.");
    }
    const resultado = await actualizarPerfil(datos);
    if (!resultado.ok) {
      setErrores(resultado.errores ?? {});
      return setAviso(resultado.errores ? null : resultado.error);
    }
    setErrores({});
    setEditando(false);
    setAviso("Los cambios se guardaron.");
  };

  const cancelar = () => {
    setDatos({ nombre: usuario.nombre, correo: usuario.correo, telefono: usuario.telefono, provincia: usuario.provincia });
    setErrores({});
    setEditando(false);
  };

  const salir = async () => {
    vaciar();
    await cerrarSesion();
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center gap-6 border border-borde bg-naranja-claro/60 p-8">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-cafe font-serif text-2xl text-papel">
          {iniciales}
        </span>
        <div className="flex-1">
          <h1 className="font-serif text-4xl">{usuario.nombre}</h1>
          <p className="mt-1 text-sm text-gris">Miembro desde el {usuario.fechaRegistro}</p>
        </div>
        <BotonEnlace href="/mis-pedidos" variante="secundario" className="rounded-md hover:shadow-md">
          Mis pedidos
        </BotonEnlace>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="border border-borde bg-papel p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-3xl">{editando ? "Editar información" : "Datos de contacto"}</h2>
            {!editando && (
              <Boton variante="secundario" onClick={() => { setAviso(null); setEditando(true); }} className="rounded-md">
                Editar información
              </Boton>
            )}
          </div>

          {editando ? (
            <form onSubmit={guardar} className="mt-6 grid gap-5 sm:grid-cols-2" noValidate>
              <Campo etiqueta="Nombre completo" value={datos.nombre} error={errores.nombre} onChange={(e) => cambiar("nombre", e.target.value)} maxLength={100} />
              <Campo etiqueta="Correo electrónico" type="email" value={datos.correo} error={errores.correo} onChange={(e) => cambiar("correo", e.target.value)} maxLength={254} />
              <Campo etiqueta="Teléfono" type="tel" inputMode="tel" placeholder="8888-8888" value={datos.telefono} error={errores.telefono} onChange={(e) => cambiar("telefono", e.target.value)} maxLength={16} />
              <Selector etiqueta="Provincia" value={datos.provincia} error={errores.provincia} onChange={(e) => cambiar("provincia", e.target.value)}>
                <option value="">Sin indicar</option>
                {PROVINCIAS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Selector>
              <div className="flex gap-3 sm:col-span-2">
                <Boton type="submit" className="rounded-md">Guardar cambios</Boton>
                <Boton type="button" variante="secundario" onClick={cancelar} className="rounded-md">Cancelar</Boton>
              </div>
            </form>
          ) : (
            <dl className="mt-6 grid gap-x-8 border-t border-borde sm:grid-cols-2">
              {[
                ["Nombre completo", usuario.nombre],
                ["Correo electrónico", usuario.correo],
                ["Teléfono", usuario.telefono || "Sin indicar"],
                ["Provincia", usuario.provincia || "Sin indicar"],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta} className="border-b border-borde py-4">
                  <dt className="text-xs uppercase tracking-wider text-gris">{etiqueta}</dt>
                  <dd className="mt-1">{valor}</dd>
                </div>
              ))}
            </dl>
          )}
          {aviso && <p className="mt-4 text-sm text-gris">{aviso}</p>}
        </section>

        <aside className="flex flex-col gap-4 border border-borde bg-papel p-8">
          <Sobretitulo>Acceso y permisos</Sobretitulo>
          
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <Insignia key={r}>{r}</Insignia>
            ))}
          </div>
          <div className="mt-auto border-t border-borde pt-4">
            <button onClick={salir} className="rounded-md bg-red-800 px-6 py-3 text-sm font-medium text-papel transition hover:bg-red-900 hover:shadow-md">
              Cerrar sesión
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}