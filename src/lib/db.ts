import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

types.setTypeParser(types.builtins.INT8, (v) => Number(v));
types.setTypeParser(types.builtins.NUMERIC, (v) => Number(v));
types.setTypeParser(types.builtins.DATE, (v) => v);

function crearPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL en el archivo .env");
  const local = /localhost|127\.0\.0\.1|host=\/|@\/|%2F/.test(url);
  return new Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false }, max: 5 });
}

const global = globalThis as unknown as { poolIntervallum?: Pool };
function pool(): Pool {
  global.poolIntervallum ??= crearPool();
  return global.poolIntervallum;
}

export async function consulta<T extends QueryResultRow>(sql: string, parametros: unknown[] = []): Promise<T[]> {
  const resultado = await pool().query<T>(sql, parametros);
  return resultado.rows;
}

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

export const db = {
  query<T extends QueryResultRow>(
    sql: string,
    parametros: unknown[] = []
  ) {
    return pool().query<T>(sql, parametros);
  },
};
