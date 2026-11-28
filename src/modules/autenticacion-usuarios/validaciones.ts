import { PROVINCIAS } from "@/lib/provincias";
import { CORREO, LETRAS, espacios, texto, type Mensaje } from "@/lib/validacion";
import type { NombreRol } from "./schema";

export type DatosCuenta = {
  nombre: string;
  correo: string;
  telefono: string;
  provincia: string;
};

export type ErroresCuenta = Partial<Record<keyof DatosCuenta | "contrasena" | "confirmacion" | "roles", string>>;

export const LIMITES_CUENTA = { nombre: 100, correo: 254, contrasenaMin: 8, contrasenaMax: 72 };

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

export function normalizarTelefono(telefono: string): string {
  const digitos = telefono.replace(/[\s()-]/g, "").replace(/^\+?506(?=\d{8}$)/, "");
  return /^\d{8}$/.test(digitos) ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : telefono.trim();
}

export function validarNombrePersona(nombre: string): Mensaje {
  const limpio = espacios(nombre);
  const error = texto(limpio, "el nombre completo", {
    min: 3,
    max: LIMITES_CUENTA.nombre,
    patron: LETRAS,
    mensajePatron: "El nombre solo puede tener letras, espacios, apóstrofos, puntos y guiones.",
  });
  if (error) return error;
  if (limpio.split(" ").filter((parte) => parte.replace(/[.'-]/g, "").length >= 2).length < 2) {
    return "Indica tu nombre y al menos un apellido.";
  }
}

export function validarCorreo(correo: string): Mensaje {
  const limpio = correo.trim();
  if (!limpio) return "Indica el correo electrónico.";
  if (limpio.length > LIMITES_CUENTA.correo) return "El correo no puede superar los 254 caracteres.";
  if (!CORREO.test(limpio)) return "Indica un correo electrónico válido, por ejemplo nombre@dominio.com.";
}

export function validarTelefono(telefono: string): Mensaje {
  if (!telefono.trim()) return;
  const digitos = telefono.replace(/[\s()-]/g, "").replace(/^\+?506(?=\d{8}$)/, "");
  if (!/^\d+$/.test(digitos)) return "El teléfono solo puede tener números, espacios, guiones y el prefijo +506.";
  if (digitos.length !== 8) return "El teléfono debe tener 8 dígitos.";
  if (!/^[245678]/.test(digitos)) return "El teléfono debe empezar con 2, 4, 5, 6, 7 u 8.";
}

export function validarProvincia(provincia: string): Mensaje {
  if (provincia && !PROVINCIAS.includes(provincia)) return "Selecciona una provincia válida.";
}

export function validarContrasena(contrasena: string, correo = ""): Mensaje {
  if (!contrasena) return "Indica una contraseña.";
  if (contrasena.length < LIMITES_CUENTA.contrasenaMin) return "La contraseña debe tener al menos 8 caracteres.";
  if (contrasena.length > LIMITES_CUENTA.contrasenaMax) return "La contraseña no puede superar los 72 caracteres.";
  if (contrasena !== contrasena.trim()) return "La contraseña no puede empezar ni terminar con espacios.";
  if (!/\p{L}/u.test(contrasena) || !/\d/.test(contrasena)) {
    return "La contraseña debe incluir al menos una letra y un número.";
  }
  if (correo && contrasena.toLowerCase() === normalizarCorreo(correo)) return "La contraseña no puede ser igual al correo.";
}

export function validarConfirmacion(contrasena: string, confirmacion: string): Mensaje {
  if (!confirmacion) return "Confirma la contraseña.";
  if (contrasena !== confirmacion) return "Las contraseñas no coinciden.";
}

export function validarDatosCuenta(datos: DatosCuenta): ErroresCuenta {
  const errores: ErroresCuenta = {};
  const nombre = validarNombrePersona(datos.nombre);
  const correo = validarCorreo(datos.correo);
  const telefono = validarTelefono(datos.telefono);
  const provincia = validarProvincia(datos.provincia);
  if (nombre) errores.nombre = nombre;
  if (correo) errores.correo = correo;
  if (telefono) errores.telefono = telefono;
  if (provincia) errores.provincia = provincia;
  return errores;
}

export function validarRegistro(datos: DatosCuenta & { contrasena: string; confirmacion: string }): ErroresCuenta {
  const errores = validarDatosCuenta(datos);
  const contrasena = validarContrasena(datos.contrasena, datos.correo);
  const confirmacion = validarConfirmacion(datos.contrasena, datos.confirmacion);
  if (contrasena) errores.contrasena = contrasena;
  if (confirmacion) errores.confirmacion = confirmacion;
  return errores;
}

export function validarAcceso(correo: string, contrasena: string): Mensaje {
  if (!correo.trim() || !contrasena) return "Completa el correo y la contraseña.";
  if (validarCorreo(correo)) return "Indica un correo electrónico válido.";
  if (contrasena.length > LIMITES_CUENTA.contrasenaMax) return "Correo o contraseña incorrectos.";
}

export const ROLES: NombreRol[] = ["Cliente", "Estudiante", "Profesor", "Encargado de pedidos", "Administrador", "Administrador del sistema"];

export function validarRoles(roles: unknown): Mensaje {
  if (!Array.isArray(roles) || roles.some((r) => typeof r !== "string")) return "Los roles no tienen un formato válido.";
  if (roles.length === 0) return "Selecciona al menos un rol.";
  if (new Set(roles).size !== roles.length) return "Hay roles repetidos.";
  const invalido = roles.find((r) => !ROLES.includes(r as NombreRol));
  if (invalido) return `El rol ${invalido} no existe.`;
}
