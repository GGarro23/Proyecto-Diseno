import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

// Conexión a PostgreSQL (local o Supabase). La cadena va en DATABASE_URL dentro de .env.
// Solo se usa en el servidor: rutas de src/app/api y archivos repository.ts.

// pg devuelve BIGINT y NUMERIC como texto; aquí se convierten a número
types.setTypeParser(types.builtins.INT8, (v) => Number(v));
types.setTypeParser(types.builtins.NUMERIC, (v) => Number(v));
// DATE se deja como texto "AAAA-MM-DD" para no cambiar de día por la zona horaria
types.setTypeParser(types.builtins.DATE, (v) => v);

function crearPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL en el archivo .env");
  const local = /localhost|127\.0\.0\.1|host=\/|@\/|%2F/.test(url);
  return new Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false }, max: 5 });
}

// En desarrollo Next recarga los módulos; se reutiliza el mismo pool para no abrir conexiones de más
const global = globalThis as unknown as { poolIntervallum?: Pool };
function pool(): Pool {
  global.poolIntervallum ??= crearPool();
  return global.poolIntervallum;
}

// Consulta simple. Usar siempre parámetros ($1, $2...) y nunca concatenar texto del usuario.
export async function consulta<T extends QueryResultRow>(sql: string, parametros: unknown[] = []): Promise<T[]> {
  const resultado = await pool().query<T>(sql, parametros);
  return resultado.rows;
}

// Varias operaciones que se confirman juntas o no se aplica ninguna
export async function transaccion<T>(trabajo: (cliente: PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool().connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await trabajo(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

// Compatibilidad con los módulos de Catálogo y Academia.
// Ambas interfaces comparten el mismo pool PostgreSQL.
export const db = {
  query<T extends QueryResultRow>(
    sql: string,
    parametros: unknown[] = []
  ) {
    return pool().query<T>(sql, parametros);
  },
};
