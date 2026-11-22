import type { PoolClient } from "pg";
import { consulta, transaccion } from "@/lib/db";
import type { MatrizPermisos } from "./permisos";
import type { Cuenta, NombreRol, UsuarioPublico } from "./schema";

const COLUMNAS_USUARIO = `
  u.id_usuario AS "idUsuario",
  u.nombre,
  u.correo,
  u.activo,
  COALESCE(u.telefono, '') AS telefono,
  COALESCE(u.provincia, '') AS provincia,
  to_char(u.fecha_registro, 'YYYY-MM-DD') AS "fechaRegistro"`;

export async function buscarCredenciales(correo: string) {
  const filas = await consulta<{ idUsuario: number; contrasenaHash: string; activo: boolean }>(
    `SELECT id_usuario AS "idUsuario", contrasena_hash AS "contrasenaHash", activo
       FROM usuario WHERE lower(btrim(correo)) = lower(btrim($1))`,
    [correo]
  );
  return filas[0] ?? null;
}

export async function buscarUsuario(idUsuario: number): Promise<UsuarioPublico | null> {
  const filas = await consulta<UsuarioPublico>(`SELECT ${COLUMNAS_USUARIO} FROM usuario u WHERE u.id_usuario = $1`, [idUsuario]);
  return filas[0] ?? null;
}

export async function rolesDe(idUsuario: number): Promise<NombreRol[]> {
  const filas = await consulta<{ nombre: NombreRol }>(
    `SELECT r.nombre FROM usuario_rol ur JOIN rol r ON r.id_rol = ur.id_rol WHERE ur.id_usuario = $1 ORDER BY r.id_rol`,
    [idUsuario]
  );
  return filas.map((f) => f.nombre);
}

export async function correoRegistrado(correo: string, excluirIdUsuario?: number): Promise<boolean> {
  const filas = await consulta(
    `SELECT 1 FROM usuario WHERE lower(btrim(correo)) = lower(btrim($1)) AND ($2::BIGINT IS NULL OR id_usuario <> $2)`,
    [correo, excluirIdUsuario ?? null]
  );
  return filas.length > 0;
}

type DatosNuevoUsuario = { nombre: string; correo: string; telefono: string; provincia: string };

export async function crearCliente(datos: DatosNuevoUsuario, contrasenaHash: string): Promise<UsuarioPublico> {
  return transaccion(async (cliente) => {
    const { rows } = await cliente.query<{ idUsuario: number }>(
      `INSERT INTO usuario (nombre, correo, contrasena_hash, telefono, provincia)
       VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''))
       RETURNING id_usuario AS "idUsuario"`,
      [datos.nombre, datos.correo, contrasenaHash, datos.telefono, datos.provincia]
    );
    const idUsuario = rows[0].idUsuario;
    await cliente.query(`INSERT INTO usuario_rol (id_usuario, id_rol) SELECT $1, id_rol FROM rol WHERE nombre = 'Cliente'`, [idUsuario]);
    const creado = await cliente.query<UsuarioPublico>(`SELECT ${COLUMNAS_USUARIO} FROM usuario u WHERE u.id_usuario = $1`, [idUsuario]);
    return creado.rows[0];
  });
}

export async function actualizarPerfil(idUsuario: number, datos: DatosNuevoUsuario): Promise<UsuarioPublico | null> {
  const filas = await consulta<UsuarioPublico>(
    `UPDATE usuario u SET nombre = $2, correo = $3, telefono = NULLIF($4, ''), provincia = NULLIF($5, '')
      WHERE u.id_usuario = $1
      RETURNING ${COLUMNAS_USUARIO}`,
    [idUsuario, datos.nombre, datos.correo, datos.telefono, datos.provincia]
  );
  return filas[0] ?? null;
}

export async function tienePermiso(idUsuario: number, codigo: string): Promise<boolean> {
  const filas = await consulta(
    `SELECT 1 FROM usuario_rol ur
       JOIN rol_permiso rp ON rp.id_rol = ur.id_rol
       JOIN permiso p ON p.id_permiso = rp.id_permiso
      WHERE ur.id_usuario = $1 AND p.codigo = $2
      LIMIT 1`,
    [idUsuario, codigo]
  );
  return filas.length > 0;
}

export async function listarCuentas(): Promise<Cuenta[]> {
  const filas = await consulta<UsuarioPublico & { roles: NombreRol[] | null }>(
    `SELECT ${COLUMNAS_USUARIO},
            array_remove(array_agg(r.nombre ORDER BY r.id_rol), NULL) AS roles
       FROM usuario u
       LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       LEFT JOIN rol r ON r.id_rol = ur.id_rol
      GROUP BY u.id_usuario
      ORDER BY u.id_usuario`
  );
  return filas.map(({ roles, ...usuario }) => ({ usuario, roles: roles ?? [] }));
}

async function reemplazarRoles(cliente: PoolClient, idUsuario: number, roles: NombreRol[]) {
  await cliente.query(`DELETE FROM usuario_rol WHERE id_usuario = $1`, [idUsuario]);
  await cliente.query(`INSERT INTO usuario_rol (id_usuario, id_rol) SELECT $1, id_rol FROM rol WHERE nombre = ANY($2::TEXT[])`, [
    idUsuario,
    roles,
  ]);
}

export async function crearCuentaInterna(datos: { nombre: string; correo: string }, contrasenaHash: string, roles: NombreRol[]) {
  return transaccion(async (cliente) => {
    const { rows } = await cliente.query<{ idUsuario: number }>(
      `INSERT INTO usuario (nombre, correo, contrasena_hash) VALUES ($1, $2, $3) RETURNING id_usuario AS "idUsuario"`,
      [datos.nombre, datos.correo, contrasenaHash]
    );
    await reemplazarRoles(cliente, rows[0].idUsuario, roles);
    return rows[0].idUsuario;
  });
}

export async function modificarCuenta(idUsuario: number, datos: { nombre: string; correo: string }, roles: NombreRol[]) {
  return transaccion(async (cliente) => {
    const { rowCount } = await cliente.query(`UPDATE usuario SET nombre = $2, correo = $3 WHERE id_usuario = $1`, [
      idUsuario,
      datos.nombre,
      datos.correo,
    ]);
    if (!rowCount) return false;
    await reemplazarRoles(cliente, idUsuario, roles);
    return true;
  });
}

export async function desactivarCuenta(idUsuario: number): Promise<boolean> {
  const filas = await consulta(`UPDATE usuario SET activo = FALSE WHERE id_usuario = $1 AND activo RETURNING id_usuario`, [idUsuario]);
  return filas.length > 0;
}

export async function leerMatriz(): Promise<MatrizPermisos> {
  const filas = await consulta<{ rol: NombreRol; codigo: string }>(
    `SELECT r.nombre AS rol, p.codigo FROM rol_permiso rp
       JOIN rol r ON r.id_rol = rp.id_rol
       JOIN permiso p ON p.id_permiso = rp.id_permiso
      ORDER BY p.id_permiso`
  );
  const matriz: MatrizPermisos = {};
  for (const f of filas) (matriz[f.rol] ??= []).push(f.codigo);
  return matriz;
}

export async function guardarMatriz(matriz: MatrizPermisos) {
  await transaccion(async (cliente) => {
    for (const [rol, codigos] of Object.entries(matriz)) {
      await cliente.query(`DELETE FROM rol_permiso WHERE id_rol = (SELECT id_rol FROM rol WHERE nombre = $1)`, [rol]);
      await cliente.query(
        `INSERT INTO rol_permiso (id_rol, id_permiso)
         SELECT r.id_rol, p.id_permiso FROM rol r, permiso p WHERE r.nombre = $1 AND p.codigo = ANY($2::TEXT[])`,
        [rol, codigos ?? []]
      );
    }
  });
}
