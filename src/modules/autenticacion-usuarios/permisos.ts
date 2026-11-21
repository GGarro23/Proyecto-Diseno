import type { NombreRol, Permiso } from "./schema";

// Permisos de las operaciones internas (RF-10, Figura 40). El backend debe revisar estos
// permisos en cada operación; la matriz solo se edita desde la administración del sistema.

export const PERMISOS: Permiso[] = [
  { idPermiso: 1, codigo: "catalogo.administrar", descripcion: "Administrar productos, categorías e inventario" },
  { idPermiso: 2, codigo: "pedidos.consultar", descripcion: "Consultar pedidos de la tienda" },
  { idPermiso: 3, codigo: "pedidos.actualizar", descripcion: "Actualizar el estado de los pedidos" },
  { idPermiso: 4, codigo: "academia.administrar", descripcion: "Administrar cursos, horarios y profesores" },
  { idPermiso: 5, codigo: "asistencias.registrar", descripcion: "Registrar asistencias" },
  { idPermiso: 6, codigo: "reportes.consultar", descripcion: "Consultar reportes" },
  { idPermiso: 7, codigo: "agente.usar", descripcion: "Generar y revisar recomendaciones del agente" },
  { idPermiso: 8, codigo: "etl.ejecutar", descripcion: "Ejecutar importaciones ETL" },
];

// Roles del personal que aparecen en la matriz. Cliente y Estudiante no tienen operaciones internas,
// y el Administrador del sistema siempre administra cuentas, roles y permisos.
export const ROLES_INTERNOS: NombreRol[] = ["Profesor", "Encargado de pedidos", "Administrador"];

export type MatrizPermisos = Partial<Record<NombreRol, string[]>>; // rol -> códigos de permiso

// Permisos iniciales según las responsabilidades del documento de visión
export const PERMISOS_INICIALES: MatrizPermisos = {
  Profesor: ["asistencias.registrar"],
  "Encargado de pedidos": ["pedidos.consultar", "pedidos.actualizar"],
  Administrador: [
    "catalogo.administrar",
    "pedidos.consultar",
    "academia.administrar",
    "reportes.consultar",
    "agente.usar",
    "etl.ejecutar",
  ],
};

export function tienePermiso(matriz: MatrizPermisos, roles: NombreRol[], codigo: string): boolean {
  return roles.some((r) => matriz[r]?.includes(codigo));
}

// RF-10: rechaza roles o permisos que no existen
export function validarMatriz(matriz: MatrizPermisos): string | undefined {
  for (const [rol, codigos] of Object.entries(matriz)) {
    if (!ROLES_INTERNOS.includes(rol as NombreRol)) return `El rol ${rol} no existe o no se configura aquí.`;
    const invalido = codigos?.find((c) => !PERMISOS.some((p) => p.codigo === c));
    if (invalido) return `El permiso ${invalido} no existe.`;
  }
}