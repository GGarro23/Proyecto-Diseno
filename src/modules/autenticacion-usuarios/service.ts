import bcrypt from "bcryptjs";
import { ErrorApi } from "@/lib/respuesta";
import { borrarSesion, crearSesion, idUsuarioDeSesion } from "@/lib/sesion";
import * as repositorio from "./repository";
import { ROLES_INTERNOS, validarMatriz, type MatrizPermisos } from "./permisos";
import type { Cuenta, NombreRol, Sesion, UsuarioPublico } from "./schema";
import { aTexto, espacios } from "@/lib/validacion";
import {
  normalizarCorreo,
  normalizarTelefono,
  validarAcceso,
  validarContrasena,
  validarDatosCuenta,
  validarRoles,
  type DatosCuenta,
} from "./validaciones";

const COSTO_BCRYPT = 10;

function limpiar(datos: Partial<Record<keyof DatosCuenta, unknown>>): DatosCuenta {
  return {
    nombre: espacios(aTexto(datos?.nombre)),
    correo: aTexto(datos?.correo),
    telefono: aTexto(datos?.telefono),
    provincia: aTexto(datos?.provincia),
  };
}

function normalizar(datos: DatosCuenta): DatosCuenta {
  return { ...datos, correo: normalizarCorreo(datos.correo), telefono: datos.telefono ? normalizarTelefono(datos.telefono) : "" };
}

function contrasenaDe(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

export async function sesionActual(): Promise<Sesion | null> {
  const idUsuario = await idUsuarioDeSesion();
  if (idUsuario === null) return null;
  const usuario = await repositorio.buscarUsuario(idUsuario);
  if (!usuario || !usuario.activo) return null;
  return { usuario, roles: await repositorio.rolesDe(idUsuario) };
}

export async function iniciarSesion(correoRecibido: unknown, contrasenaRecibida: unknown): Promise<Sesion> {
  const correo = aTexto(correoRecibido);
  const contrasena = contrasenaDe(contrasenaRecibida);
  const error = validarAcceso(correo, contrasena);
  if (error) throw new ErrorApi(error.startsWith("Correo o") ? 401 : 400, error);
  const credenciales = await repositorio.buscarCredenciales(correo);
  const valida = credenciales !== null && (await bcrypt.compare(contrasena, credenciales.contrasenaHash));
  if (!credenciales || !valida) throw new ErrorApi(401, "Correo o contraseña incorrectos.");
  if (!credenciales.activo) throw new ErrorApi(403, "Esta cuenta está desactivada.");
  await crearSesion(credenciales.idUsuario);
  return (await sesionActual())!;
}

export async function cerrarSesion() {
  await borrarSesion();
}

export async function registrar(datos: Partial<Record<keyof DatosCuenta | "contrasena", unknown>>): Promise<UsuarioPublico> {
  const limpios = limpiar(datos);
  const contrasena = contrasenaDe(datos?.contrasena);
  const errores = validarDatosCuenta(limpios);
  const errorContrasena = validarContrasena(contrasena, limpios.correo);
  if (errorContrasena) errores.contrasena = errorContrasena;
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, "Revisa los datos marcados.", errores);
  const normalizados = normalizar(limpios);
  if (await repositorio.correoRegistrado(normalizados.correo)) {
    throw new ErrorApi(409, "Ya existe una cuenta con ese correo.", { correo: "Este correo ya está registrado." });
  }
  const hash = await bcrypt.hash(contrasena, COSTO_BCRYPT);
  return repositorio.crearCliente(normalizados, hash);
}

export async function actualizarPerfil(datos: Partial<Record<keyof DatosCuenta, unknown>>): Promise<UsuarioPublico> {
  const sesion = await requerirSesion();
  const limpios = limpiar(datos);
  const errores = validarDatosCuenta(limpios);
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, "Revisa los datos marcados.", errores);
  const normalizados = normalizar(limpios);
  if (await repositorio.correoRegistrado(normalizados.correo, sesion.usuario.idUsuario)) {
    throw new ErrorApi(409, "Ese correo ya está en uso.", { correo: "Este correo ya está registrado." });
  }
  const actualizado = await repositorio.actualizarPerfil(sesion.usuario.idUsuario, normalizados);
  if (!actualizado) throw new ErrorApi(404, "La cuenta no existe.");
  return actualizado;
}

export async function requerirSesion(): Promise<Sesion> {
  const sesion = await sesionActual();
  if (!sesion) throw new ErrorApi(401, "Inicia sesión para continuar.");
  return sesion;
}

export async function requerirRol(...roles: NombreRol[]): Promise<Sesion> {
  const sesion = await requerirSesion();
  if (!roles.some((r) => sesion.roles.includes(r))) throw new ErrorApi(403, "No tienes permiso para esta operación.");
  return sesion;
}

export async function requerirPermiso(codigo: string): Promise<Sesion> {
  const sesion = await requerirSesion();
  if (!(await repositorio.tienePermiso(sesion.usuario.idUsuario, codigo))) {
    throw new ErrorApi(403, "No tienes permiso para esta operación.");
  }
  return sesion;
}

const ADMIN_SISTEMA: NombreRol = "Administrador del sistema";

type DatosCuentaInterna = { nombre?: unknown; correo?: unknown; roles?: unknown };

function validarCuentaInterna(datos: DatosCuentaInterna) {
  const limpios = { nombre: espacios(aTexto(datos?.nombre)), correo: aTexto(datos?.correo) };
  const errores = validarDatosCuenta({ ...limpios, telefono: "", provincia: "" });
  const errorRoles = validarRoles(datos?.roles);
  if (errorRoles) errores.roles = errorRoles;
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, "Revisa los datos marcados.", errores);
  return { ...limpios, correo: normalizarCorreo(limpios.correo), roles: datos.roles as NombreRol[] };
}

function idUsuarioValido(idUsuario: number) {
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) throw new ErrorApi(400, "El identificador de la cuenta no es válido.");
}

export async function listarCuentas(): Promise<Cuenta[]> {
  await requerirRol(ADMIN_SISTEMA);
  return repositorio.listarCuentas();
}

export async function registrarCuentaInterna(datos: DatosCuentaInterna & { contrasena?: unknown }): Promise<Cuenta> {
  await requerirRol(ADMIN_SISTEMA);
  const { roles, ...limpios } = validarCuentaInterna(datos);
  const contrasena = contrasenaDe(datos?.contrasena);
  const errorContrasena = validarContrasena(contrasena, limpios.correo);
  if (errorContrasena) throw new ErrorApi(400, "Revisa los datos marcados.", { contrasena: errorContrasena });
  if (await repositorio.correoRegistrado(limpios.correo)) {
    throw new ErrorApi(409, "Ya existe una cuenta con ese correo.", { correo: "Este correo ya está registrado." });
  }
  const idUsuario = await repositorio.crearCuentaInterna(limpios, await bcrypt.hash(contrasena, COSTO_BCRYPT), roles);
  return { usuario: (await repositorio.buscarUsuario(idUsuario))!, roles: await repositorio.rolesDe(idUsuario) };
}

export async function modificarCuenta(idUsuario: number, datos: DatosCuentaInterna): Promise<Cuenta> {
  const sesion = await requerirRol(ADMIN_SISTEMA);
  idUsuarioValido(idUsuario);
  const { roles, ...limpios } = validarCuentaInterna(datos);
  if (idUsuario === sesion.usuario.idUsuario && !roles.includes(ADMIN_SISTEMA)) {
    throw new ErrorApi(400, "No puedes quitarte el rol Administrador del sistema.");
  }
  if (await repositorio.correoRegistrado(limpios.correo, idUsuario)) {
    throw new ErrorApi(409, "Ese correo ya está en uso.", { correo: "Este correo ya está registrado." });
  }
  if (!(await repositorio.modificarCuenta(idUsuario, limpios, roles))) throw new ErrorApi(404, "La cuenta no existe.");
  return { usuario: (await repositorio.buscarUsuario(idUsuario))!, roles: await repositorio.rolesDe(idUsuario) };
}

export async function desactivarCuenta(idUsuario: number): Promise<Cuenta> {
  const sesion = await requerirRol(ADMIN_SISTEMA);
  idUsuarioValido(idUsuario);
  if (idUsuario === sesion.usuario.idUsuario) throw new ErrorApi(400, "No puedes desactivar tu propia cuenta.");
  const usuario = await repositorio.buscarUsuario(idUsuario);
  if (!usuario) throw new ErrorApi(404, "La cuenta no existe.");
  if (!usuario.activo) throw new ErrorApi(409, "La cuenta ya está desactivada.");
  await repositorio.desactivarCuenta(idUsuario);
  return { usuario: { ...usuario, activo: false }, roles: await repositorio.rolesDe(idUsuario) };
}

export async function consultarPermisos(): Promise<MatrizPermisos> {
  await requerirRol(ADMIN_SISTEMA);
  const guardada = await repositorio.leerMatriz();
  return Object.fromEntries(ROLES_INTERNOS.map((r) => [r, guardada[r] ?? []]));
}

export async function guardarPermisos(matriz: MatrizPermisos): Promise<MatrizPermisos> {
  await requerirRol(ADMIN_SISTEMA);
  if (!matriz || typeof matriz !== "object" || Array.isArray(matriz)) throw new ErrorApi(400, "La matriz de permisos no es válida.");
  const error = validarMatriz(matriz);
  if (error) throw new ErrorApi(400, error);
  await repositorio.guardarMatriz(matriz);
  return consultarPermisos();
}
