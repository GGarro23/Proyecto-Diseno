import bcrypt from "bcryptjs";
import { ErrorApi } from "@/lib/respuesta";
import { borrarSesion, crearSesion, idUsuarioDeSesion } from "@/lib/sesion";
import * as repositorio from "./repository";
import type { NombreRol, Sesion, UsuarioPublico } from "./schema";
import { validarContrasena, validarDatosCuenta, type DatosCuenta } from "./validaciones";

// Reglas de AF-01 (RF-01 a RF-05) y control de acceso que usan todos los módulos.
// Las rutas de src/app/api llaman a estas funciones; nunca a repository.ts directamente.

const COSTO_BCRYPT = 10; // RNF-01

function limpiar(datos: DatosCuenta): DatosCuenta {
  return {
    nombre: (datos.nombre ?? "").trim(),
    correo: (datos.correo ?? "").trim(),
    telefono: (datos.telefono ?? "").trim(),
    provincia: datos.provincia ?? "",
  };
}

// ---------- Sesión ----------

// Sesión de la cookie con los datos y roles vigentes; null si no hay o la cuenta está desactivada
export async function sesionActual(): Promise<Sesion | null> {
  const idUsuario = await idUsuarioDeSesion();
  if (idUsuario === null) return null;
  const usuario = await repositorio.buscarUsuario(idUsuario);
  if (!usuario || !usuario.activo) return null;
  return { usuario, roles: await repositorio.rolesDe(idUsuario) };
}

// RF-02 / CU-02
export async function iniciarSesion(correo: string, contrasena: string): Promise<Sesion> {
  if (!correo?.trim() || !contrasena) throw new ErrorApi(400, "Completa el correo y la contraseña.");
  const credenciales = await repositorio.buscarCredenciales(correo);
  const valida = credenciales !== null && (await bcrypt.compare(contrasena, credenciales.contrasenaHash));
  if (!credenciales || !valida) throw new ErrorApi(401, "Correo o contraseña incorrectos.");
  if (!credenciales.activo) throw new ErrorApi(403, "Esta cuenta está desactivada."); // RF-08
  await crearSesion(credenciales.idUsuario);
  return (await sesionActual())!;
}

// RF-03 / CU-03
export async function cerrarSesion() {
  await borrarSesion();
}

// ---------- Cuenta propia ----------

// RF-01 / CU-01: la cuenta nueva siempre es Cliente
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

// RF-05: solo datos personales de la cuenta con sesión; roles y permisos no cambian aquí
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

// ---------- Control de acceso para todos los módulos ----------
// Uso en una ruta:   const sesion = await requerirPermiso("catalogo.administrar");

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

// RF-10: revisa la matriz de permisos guardada en rol_permiso
export async function requerirPermiso(codigo: string): Promise<Sesion> {
  const sesion = await requerirSesion();
  if (!(await repositorio.tienePermiso(sesion.usuario.idUsuario, codigo))) {
    throw new ErrorApi(403, "No tienes permiso para esta operación.");
  }
  return sesion;
}