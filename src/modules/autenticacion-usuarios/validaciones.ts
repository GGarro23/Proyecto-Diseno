import { PROVINCIAS } from "@/lib/provincias";
import type { NombreRol } from "./schema";

// Validaciones de datos de cuenta (RF-01, RF-05). Las usa el frontend y debe usarlas el backend.

export type DatosCuenta = {
  nombre: string;
  correo: string;
  telefono: string;
  provincia: string;
};

export type ErroresCuenta = Partial<Record<keyof DatosCuenta | "contrasena", string>>;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarContrasena(contrasena: string): string | undefined {
  if (contrasena.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
    return "La contraseña debe incluir al menos una letra y un número.";
  }
}

export function validarDatosCuenta(datos: DatosCuenta): ErroresCuenta {
  const errores: ErroresCuenta = {};
  if (!datos.nombre.trim()) errores.nombre = "Indica tu nombre completo.";
  if (!CORREO.test(datos.correo.trim())) errores.correo = "Indica un correo electrónico válido.";
  // Teléfono y provincia son opcionales
  if (datos.telefono.trim() && datos.telefono.replace(/\D/g, "").replace(/^506/, "").length !== 8) {
    errores.telefono = "El teléfono debe tener 8 dígitos.";
  }
  if (datos.provincia && !PROVINCIAS.includes(datos.provincia)) errores.provincia = "Selecciona una provincia válida.";
  return errores;
}

export const ROLES: NombreRol[] = ["Cliente", "Estudiante", "Profesor", "Encargado de pedidos", "Administrador", "Administrador del sistema"];

// RF-09: al menos un rol y solo roles existentes
export function validarRoles(roles: string[]): string | undefined {
  if (roles.length === 0) return "Selecciona al menos un rol.";
  const invalido = roles.find((r) => !ROLES.includes(r as NombreRol));
  if (invalido) return `El rol ${invalido} no existe.`;
}