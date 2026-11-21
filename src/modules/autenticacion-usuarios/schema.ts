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
  telefono: string;
  provincia: string;
  fechaRegistro: string;
};

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

export type Cuenta = {
  usuario: UsuarioPublico;
  roles: NombreRol[];
};
