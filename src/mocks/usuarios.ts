import type { UsuarioPublico } from "@/modules/autenticacion-usuarios/schema";

// Profesores de prueba (nombres de la Figura 17). El rol Profesor se asigna con UsuarioRol.
export const profesores: UsuarioPublico[] = [
  { idUsuario: 10, nombre: "Mariana Solano", correo: "mariana@intervallum.cr", activo: true, telefono: "+506 8800 1010", provincia: "San José", fechaRegistro: "2021-03-01" },
  { idUsuario: 11, nombre: "Andrés Quesada", correo: "andres@intervallum.cr", activo: true, telefono: "+506 8800 1111", provincia: "Heredia", fechaRegistro: "2021-08-15" },
  { idUsuario: 12, nombre: "Lucía Vargas", correo: "lucia@intervallum.cr", activo: true, telefono: "+506 8800 1212", provincia: "Cartago", fechaRegistro: "2022-01-10" },
];

// Estudiantes de prueba: Ana Mora y quienes ocupan los cupos de los cursos
// (idUsuario 1000 a 1004 en mocks/academia-simulada.ts). Nombres de las Figuras 24 a 26.
export const estudiantes: UsuarioPublico[] = [
  { idUsuario: 1, nombre: "Ana Mora", correo: "ana@intervallum.cr", activo: true, telefono: "+506 8888 1840", provincia: "San José", fechaRegistro: "2023-02-14" },
  { idUsuario: 1000, nombre: "Diego Rojas", correo: "diego@correo.com", activo: true, telefono: "", provincia: "San José", fechaRegistro: "2024-01-10" },
  { idUsuario: 1001, nombre: "Sofía Campos", correo: "sofia@correo.com", activo: true, telefono: "", provincia: "Heredia", fechaRegistro: "2024-02-11" },
  { idUsuario: 1002, nombre: "Martín Vega", correo: "martin@correo.com", activo: true, telefono: "", provincia: "Cartago", fechaRegistro: "2024-03-12" },
  { idUsuario: 1003, nombre: "Valeria Núñez", correo: "valeria@correo.com", activo: true, telefono: "", provincia: "Alajuela", fechaRegistro: "2024-04-13" },
  { idUsuario: 1004, nombre: "José Brenes", correo: "jose@correo.com", activo: true, telefono: "", provincia: "San José", fechaRegistro: "2024-05-14" },
];