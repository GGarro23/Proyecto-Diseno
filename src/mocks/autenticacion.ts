import type { NombreRol, Sesion, UsuarioPublico } from "@/modules/autenticacion-usuarios/schema";
import {
  validarContrasena,
  validarDatosCuenta,
  validarRoles,
  type DatosCuenta,
  type ErroresCuenta,
} from "@/modules/autenticacion-usuarios/validaciones";
import { estudiantes } from "./usuarios";

// Simula la API de autenticación mientras no exista backend (RF-01 a RF-05, CU-01 a CU-03).
// SOLO PARA PRUEBAS: aquí las contraseñas están en texto plano. El backend debe usar bcrypt (RNF-01).

type UsuarioPrueba = UsuarioPublico & { contrasena: string; roles: NombreRol[] };

export const CONTRASENA_PRUEBA = "Intervallum1";

// Un usuario por rol, más una cuenta desactivada para probar RF-02
const base: UsuarioPrueba[] = [
  { idUsuario: 1, nombre: "Ana Mora", correo: "ana@intervallum.cr", activo: true, telefono: "+506 8888 1840", provincia: "San José", fechaRegistro: "2023-02-14", contrasena: CONTRASENA_PRUEBA, roles: ["Estudiante", "Cliente"] },
  { idUsuario: 2, nombre: "Carlos Rojas", correo: "carlos@intervallum.cr", activo: true, telefono: "", provincia: "", fechaRegistro: "2024-05-03", contrasena: CONTRASENA_PRUEBA, roles: ["Cliente"] },
  { idUsuario: 10, nombre: "Mariana Solano", correo: "mariana@intervallum.cr", activo: true, telefono: "+506 8800 1010", provincia: "San José", fechaRegistro: "2021-03-01", contrasena: CONTRASENA_PRUEBA, roles: ["Profesor"] },
  { idUsuario: 20, nombre: "Diego Campos", correo: "pedidos@intervallum.cr", activo: true, telefono: "", provincia: "San José", fechaRegistro: "2022-06-20", contrasena: CONTRASENA_PRUEBA, roles: ["Encargado de pedidos"] },
  { idUsuario: 30, nombre: "Laura Jiménez", correo: "admin@intervallum.cr", activo: true, telefono: "", provincia: "San José", fechaRegistro: "2020-01-15", contrasena: CONTRASENA_PRUEBA, roles: ["Administrador"] },
  { idUsuario: 31, nombre: "Pablo Arias", correo: "sistema@intervallum.cr", activo: true, telefono: "", provincia: "San José", fechaRegistro: "2020-01-15", contrasena: CONTRASENA_PRUEBA, roles: ["Administrador del sistema"] },
  { idUsuario: 40, nombre: "Cuenta Desactivada", correo: "inactivo@intervallum.cr", activo: false, telefono: "", provincia: "", fechaRegistro: "2023-09-09", contrasena: CONTRASENA_PRUEBA, roles: ["Cliente"] },
];

const CLAVE_USUARIOS = "intervallum-usuarios";
const CLAVE_SESION = "intervallum-sesion";
const oyentes = new Set<() => void>();

type Resultado<T> = { ok: true; dato: T } | { ok: false; error: string; errores?: ErroresCuenta };

function leerUsuarios(): UsuarioPrueba[] {
  try {
    const guardados: UsuarioPrueba[] = JSON.parse(localStorage.getItem(CLAVE_USUARIOS) ?? "[]");
    // Los guardados reemplazan a los de base (perfil editado) o se agregan (registro)
    return [...base.filter((b) => !guardados.some((g) => g.idUsuario === b.idUsuario)), ...guardados];
  } catch {
    return base;
  }
}

function guardarUsuario(usuario: UsuarioPrueba) {
  try {
    const guardados: UsuarioPrueba[] = JSON.parse(localStorage.getItem(CLAVE_USUARIOS) ?? "[]");
    const otros = guardados.filter((g) => g.idUsuario !== usuario.idUsuario);
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify([...otros, usuario]));
  } catch {}
}

function avisar() {
  oyentes.forEach((f) => f());
}

function aSesion(u: UsuarioPrueba): Sesion {
  return {
    usuario: {
      idUsuario: u.idUsuario,
      nombre: u.nombre,
      correo: u.correo,
      activo: u.activo,
      telefono: u.telefono,
      provincia: u.provincia,
      fechaRegistro: u.fechaRegistro,
    },
    roles: u.roles,
  };
}

// Para useSyncExternalStore: "idUsuario|usuarios guardados". Cambia al iniciar
// o cerrar sesión y al editar el perfil.
export function leerEstadoSesion(): string {
  try {
    return `${localStorage.getItem(CLAVE_SESION) ?? ""}|${localStorage.getItem(CLAVE_USUARIOS) ?? ""}`;
  } catch {
    return "|";
  }
}

export function suscribirSesion(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

// Nombre visible de un usuario (lo usan las pantallas de pedidos).
// También busca en los estudiantes de prueba de mocks/usuarios.ts.
export function nombreDeUsuario(idUsuario: number): string {
  const usuario = [...leerUsuarios(), ...estudiantes].find((u) => u.idUsuario === idUsuario);
  return usuario?.nombre ?? `Usuario ${idUsuario}`;
}

export function obtenerSesion(estado: string): Sesion | null {
  const idSesion = estado.split("|")[0];
  if (!idSesion) return null;
  const usuario = leerUsuarios().find((u) => String(u.idUsuario) === idSesion && u.activo);
  return usuario ? aSesion(usuario) : null;
}

// RF-02 / CU-02
export function iniciarSesion(correo: string, contrasena: string): Resultado<Sesion> {
  const usuario = leerUsuarios().find((u) => u.correo.toLowerCase() === correo.trim().toLowerCase());
  if (!usuario || usuario.contrasena !== contrasena) return { ok: false, error: "Correo o contraseña incorrectos." };
  if (!usuario.activo) return { ok: false, error: "Esta cuenta está desactivada." };
  localStorage.setItem(CLAVE_SESION, String(usuario.idUsuario));
  avisar();
  return { ok: true, dato: aSesion(usuario) };
}

// RF-03 / CU-03
export function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
  avisar();
}

// RF-01 / CU-01: crea la cuenta con rol Cliente
export function registrar(datos: DatosCuenta & { contrasena: string }): Resultado<UsuarioPublico> {
  const errores = validarDatosCuenta(datos);
  const errorContrasena = validarContrasena(datos.contrasena);
  if (errorContrasena) errores.contrasena = errorContrasena;
  if (Object.keys(errores).length > 0) return { ok: false, error: "Revisa los datos marcados.", errores };

  const usuarios = leerUsuarios();
  if (usuarios.some((u) => u.correo.toLowerCase() === datos.correo.trim().toLowerCase())) {
    return { ok: false, error: "Ya existe una cuenta con ese correo.", errores: { correo: "Este correo ya está registrado." } };
  }

  const nuevo: UsuarioPrueba = {
    idUsuario: Math.max(...usuarios.map((u) => u.idUsuario)) + 1,
    nombre: datos.nombre.trim(),
    correo: datos.correo.trim(),
    telefono: datos.telefono.trim(),
    provincia: datos.provincia,
    activo: true,
    fechaRegistro: new Date().toISOString().slice(0, 10),
    contrasena: datos.contrasena,
    roles: ["Cliente"],
  };
  guardarUsuario(nuevo);
  return { ok: true, dato: aSesion(nuevo).usuario };
}

// RF-05: solo datos personales; roles y permisos no se modifican aquí
export function actualizarPerfil(idUsuario: number, datos: DatosCuenta): Resultado<UsuarioPublico> {
  const errores = validarDatosCuenta(datos);
  if (Object.keys(errores).length > 0) return { ok: false, error: "Revisa los datos marcados.", errores };

  const usuarios = leerUsuarios();
  const actual = usuarios.find((u) => u.idUsuario === idUsuario);
  if (!actual) return { ok: false, error: "La cuenta no existe." };
  const correo = datos.correo.trim();
  if (usuarios.some((u) => u.idUsuario !== idUsuario && u.correo.toLowerCase() === correo.toLowerCase())) {
    return { ok: false, error: "Ese correo ya está en uso.", errores: { correo: "Este correo ya está registrado." } };
  }

  const actualizado = { ...actual, nombre: datos.nombre.trim(), correo, telefono: datos.telefono.trim(), provincia: datos.provincia };
  guardarUsuario(actualizado);
  avisar();
  return { ok: true, dato: aSesion(actualizado).usuario };
}

// ---- Administración de cuentas del Administrador del sistema (RF-06 a RF-09) ----

export type Cuenta = { usuario: UsuarioPublico; roles: NombreRol[] };

// Convierte el texto de leerEstadoSesion en la lista de cuentas (para useSyncExternalStore)
export function cuentasDesde(estado: string): Cuenta[] {
  const texto = estado.slice(estado.indexOf("|") + 1);
  const guardados: UsuarioPrueba[] = texto ? JSON.parse(texto) : [];
  return [...base.filter((b) => !guardados.some((g) => g.idUsuario === b.idUsuario)), ...guardados]
    .map(aSesion)
    .sort((a, b) => a.usuario.idUsuario - b.usuario.idUsuario);
}

const correoEnUso = (usuarios: UsuarioPrueba[], correo: string, idUsuario?: number) =>
  usuarios.some((u) => u.idUsuario !== idUsuario && u.correo.toLowerCase() === correo.trim().toLowerCase());

// RF-06: cuenta interna con correo único, contraseña inicial y roles
export function registrarCuentaInterna(datos: { nombre: string; correo: string; contrasena: string; roles: NombreRol[] }): Resultado<Cuenta> {
  const errores = validarDatosCuenta({ nombre: datos.nombre, correo: datos.correo, telefono: "", provincia: "" });
  const errorContrasena = validarContrasena(datos.contrasena);
  if (errorContrasena) errores.contrasena = errorContrasena;
  if (Object.keys(errores).length > 0) return { ok: false, error: "Revisa los datos marcados.", errores };
  const errorRoles = validarRoles(datos.roles);
  if (errorRoles) return { ok: false, error: errorRoles };

  const usuarios = leerUsuarios();
  if (correoEnUso(usuarios, datos.correo)) {
    return { ok: false, error: "Ya existe una cuenta con ese correo.", errores: { correo: "Este correo ya está registrado." } };
  }
  const nuevo: UsuarioPrueba = {
    idUsuario: Math.max(...usuarios.map((u) => u.idUsuario)) + 1,
    nombre: datos.nombre.trim(),
    correo: datos.correo.trim(),
    telefono: "",
    provincia: "",
    activo: true,
    fechaRegistro: new Date().toISOString().slice(0, 10),
    contrasena: datos.contrasena,
    roles: datos.roles,
  };
  guardarUsuario(nuevo);
  avisar();
  return { ok: true, dato: aSesion(nuevo) };
}

// RF-07: datos administrativos (nombre y correo)
export function modificarCuenta(idUsuario: number, datos: { nombre: string; correo: string }): Resultado<Cuenta> {
  const usuarios = leerUsuarios();
  const actual = usuarios.find((u) => u.idUsuario === idUsuario);
  if (!actual) return { ok: false, error: "La cuenta no existe." };
  const errores = validarDatosCuenta({ nombre: datos.nombre, correo: datos.correo, telefono: "", provincia: "" });
  if (Object.keys(errores).length > 0) return { ok: false, error: "Revisa los datos marcados.", errores };
  if (correoEnUso(usuarios, datos.correo, idUsuario)) {
    return { ok: false, error: "Ese correo ya está en uso.", errores: { correo: "Este correo ya está registrado." } };
  }
  const actualizado = { ...actual, nombre: datos.nombre.trim(), correo: datos.correo.trim() };
  guardarUsuario(actualizado);
  avisar();
  return { ok: true, dato: aSesion(actualizado) };
}

// RF-08: la cuenta ya no puede iniciar sesión; su historial se conserva
export function desactivarCuenta(idUsuario: number, idSolicitante: number): Resultado<Cuenta> {
  const actual = leerUsuarios().find((u) => u.idUsuario === idUsuario);
  if (!actual) return { ok: false, error: "La cuenta no existe." };
  if (!actual.activo) return { ok: false, error: "La cuenta ya está desactivada." };
  if (idUsuario === idSolicitante) return { ok: false, error: "No puedes desactivar tu propia cuenta." };
  const actualizado = { ...actual, activo: false };
  guardarUsuario(actualizado);
  avisar();
  return { ok: true, dato: aSesion(actualizado) };
}

// RF-09: reemplaza los roles de la cuenta
export function asignarRoles(idUsuario: number, roles: NombreRol[], idSolicitante: number): Resultado<Cuenta> {
  const actual = leerUsuarios().find((u) => u.idUsuario === idUsuario);
  if (!actual) return { ok: false, error: "La cuenta no existe." };
  const error = validarRoles(roles);
  if (error) return { ok: false, error };
  if (idUsuario === idSolicitante && !roles.includes("Administrador del sistema")) {
    return { ok: false, error: "No puedes quitarte el rol Administrador del sistema." };
  }
  const actualizado = { ...actual, roles };
  guardarUsuario(actualizado);
  avisar();
  return { ok: true, dato: aSesion(actualizado) };
}