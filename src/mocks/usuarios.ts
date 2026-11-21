import type { UsuarioPublico } from "@/modules/autenticacion-usuarios/schema";

// Profesores de prueba (nombres de la Figura 17). El rol Profesor se asigna con UsuarioRol.
export const profesores: UsuarioPublico[] = [
  { idUsuario: 10, nombre: "Mariana Solano", correo: "mariana@intervallum.cr", activo: true, telefono: "+506 8800 1010", provincia: "San José", fechaRegistro: "2021-03-01" },
  { idUsuario: 11, nombre: "Andrés Quesada", correo: "andres@intervallum.cr", activo: true, telefono: "+506 8800 1111", provincia: "Heredia", fechaRegistro: "2021-08-15" },
  { idUsuario: 12, nombre: "Lucía Vargas", correo: "lucia@intervallum.cr", activo: true, telefono: "+506 8800 1212", provincia: "Cartago", fechaRegistro: "2022-01-10" },
];