import type { NombreRol, UsuarioPublico } from "@/modules/autenticacion-usuarios/schema";

// Sesión simulada mientras no exista autenticación. null = sin sesión.
// Datos de la Figura 20.
export type Sesion = {
  usuario: UsuarioPublico;
  roles: NombreRol[];
};

export const sesion: Sesion | null = {
  usuario: {
    idUsuario: 1,
    nombre: "Ana Mora",
    correo: "ana@intervallum.cr",
    activo: true,
    telefono: "+506 8888 1840",
    provincia: "San José",
    fechaRegistro: "2023-02-14",
  },
  roles: ["Estudiante", "Cliente"],
};