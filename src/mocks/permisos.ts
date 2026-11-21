import { PERMISOS_INICIALES, validarMatriz, type MatrizPermisos } from "@/modules/autenticacion-usuarios/permisos";

// Dato temporal de la matriz de permisos (RF-10). Con el backend se guarda en RolPermiso.

type Resultado<T> = { ok: true; dato: T } | { ok: false; error: string };

const CLAVE = "intervallum-permisos";
const oyentes = new Set<() => void>();

export function suscribirPermisos(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

export function leerEstadoPermisos(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "";
  } catch {
    return "";
  }
}

export function permisosDesde(estado: string): MatrizPermisos {
  return estado ? JSON.parse(estado) : PERMISOS_INICIALES;
}

// RF-10: no toca cuentas ni datos personales, solo la relación rol-permiso
export function guardarPermisos(matriz: MatrizPermisos): Resultado<MatrizPermisos> {
  const error = validarMatriz(matriz);
  if (error) return { ok: false, error };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(matriz));
  } catch {}
  oyentes.forEach((f) => f());
  return { ok: true, dato: matriz };
}