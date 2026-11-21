import bcrypt from "bcryptjs";
import { ErrorApi } from "@/lib/respuesta";
import { borrarSesion, crearSesion, idUsuarioDeSesion } from "@/lib/sesion";
import * as repositorio from "./repository";
import { ROLES_INTERNOS, validarMatriz, type MatrizPermisos } from "./permisos";
import type { Cuenta, NombreRol, Sesion, UsuarioPublico } from "./schema";
import { validarContrasena, validarDatosCuenta, validarRoles, type DatosCuenta } from "./validaciones";

const COSTO_BCRYPT = 10;

function limpiar(datos: DatosCuenta): DatosCuenta {
  return {
    nombre: (datos.nombre ?? "").trim(),
    correo: (datos.correo ?? "").trim(),
    telefono: (datos.telefono ?? "").trim(),
    provincia: datos.provincia ?? "",
  };
}

export async function sesionActual(): Promise<Sesion | null> {
  const idUsuario = await idUsuarioDeSesion();
  if (idUsuario === null) return null;
  const usuario = await repositorio.buscarUsuario(idUsuario);
  if (!usuario || !usuario.activo) return null;
  return { usuario, roles: await repositorio.rolesDe(idUsuario) };
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<Sesion> {
  if (!correo?.trim() || !contrasena) throw new ErrorApi(400, "Completa el correo y la contraseña.");
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

export async function registrar(datos: DatosCuenta & { contrasena: string }): Promise<UsuarioPublico> {
  const limpios = limpiar(datos);
  const errores = validarDatosCuenta(limpios);
  const errorContrasena = validarContrasena(datos.contrasena ?? "");
  if (errorContrasena) errores.contrasena = errorContrasena;
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, "Revisa los datos marcados.", errores);
  if (await repositorio.correoRegistrado(limpios.correo)) {
    throw new ErrorApi(409, "Ya existe una cuenta con ese correo.", { correo: "Este correo ya está registrado." });
  }
  const hash = await bcrypt.hash(datos.contrasena, COSTO_BCRYPT);
  return repositorio.crearCliente(limpios, hash);
}

export async function actualizarPerfil(datos: DatosCuenta): Promise<UsuarioPublico> {
  const sesion = await requerirSesion();
  const limpios = limpiar(datos);
  const errores = validarDatosCuenta(limpios);
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, "Revisa los datos marcados.", errores);
  if (await repositorio.correoRegistrado(limpios.correo, sesion.usuario.idUsuario)) {
    throw new ErrorApi(409, "Ese correo ya está en uso.", { correo: "Este correo ya está registrado." });
  }
  const actualizado = await repositorio.actualizarPerfil(sesion.usuario.idUsuario, limpios);
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

type DatosCuentaInterna = { nombre: string; correo: string; roles: NombreRol[] };

function validarCuentaInterna(datos: DatosCuentaInterna) {
  const limpios = { nombre: (datos.nombre ?? "").trim(), correo: (datos.correo ?? "").trim() };
  const errores = validarDatosCuenta({ ...limpios, telefono: "", provincia: "" });
  if (Object.keys(errores).length > 0) throw new ErrorApi(400, "Revisa los datos marcados.", errores);
  const roles = Array.isArray(datos.roles) ? datos.roles : [];
  const errorRoles = validarRoles(roles);
  if (errorRoles) throw new ErrorApi(400, errorRoles);
  return { ...limpios, roles };
}

export async function listarCuentas(): Promise<Cuenta[]> {
  await requerirRol(ADMIN_SISTEMA);
  return repositorio.listarCuentas();
}

export async function registrarCuentaInterna(datos: DatosCuentaInterna & { contrasena: string }): Promise<Cuenta> {
  await requerirRol(ADMIN_SISTEMA);
  const { roles, ...limpios } = validarCuentaInterna(datos);
  const errorContrasena = validarContrasena(datos.contrasena ?? "");
  if (errorContrasena) throw new ErrorApi(400, "Revisa los datos marcados.", { contrasena: errorContrasena });
  if (await repositorio.correoRegistrado(limpios.correo)) {
    throw new ErrorApi(409, "Ya existe una cuenta con ese correo.", { correo: "Este correo ya está registrado." });
  }
  const idUsuario = await repositorio.crearCuentaInterna(limpios, await bcrypt.hash(datos.contrasena, COSTO_BCRYPT), roles);
  return { usuario: (await repositorio.buscarUsuario(idUsuario))!, roles: await repositorio.rolesDe(idUsuario) };
}

export async function modificarCuenta(idUsuario: number, datos: DatosCuentaInterna): Promise<Cuenta> {
  const sesion = await requerirRol(ADMIN_SISTEMA);
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
  if (!matriz || typeof matriz !== "object") throw new ErrorApi(400, "La matriz de permisos no es válida.");
  const error = validarMatriz(matriz);
  if (error) throw new ErrorApi(400, error);
  await repositorio.guardarMatriz(matriz);
  return consultarPermisos();
}
