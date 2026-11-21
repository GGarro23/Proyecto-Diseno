// AF-01 Gestión de usuarios y acceso

export type NombreRol =
  | "Cliente"
  | "Estudiante"
  | "Profesor"
  | "Encargado de pedidos"
  | "Administrador"
  | "Administrador del sistema";

export type Usuario = {
  idUsuario: number;
  nombre: string;
  correo: string;
  contrasenaHash: string;
  activo: boolean;
  telefono: string;      // no está en el modelo (Figuras 20 y 21)
  provincia: string;     // no está en el modelo (Figuras 20 y 21)
  fechaRegistro: string; // no está en el modelo (Figura 20)
};

// Lo que se envía al frontend: nunca incluye la contraseña
export type UsuarioPublico = Omit<Usuario, "contrasenaHash">;

export type Rol = {
  idRol: number;
  nombre: NombreRol;
  descripcion: string;
};

export type Permiso = {
  idPermiso: number;
  codigo: string;
  descripcion: string;
};

// Sesión del usuario autenticado (RF-02): datos públicos y roles vigentes
export type Sesion = {
  usuario: UsuarioPublico;
  roles: NombreRol[];
};

export type UsuarioRol = {
  idUsuario: number;
  idRol: number;
};

export type RolPermiso = {
  idRol: number;
  idPermiso: number;
};