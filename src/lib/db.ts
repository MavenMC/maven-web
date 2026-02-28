import "server-only";
import mysql from "mysql2/promise";

const host = process.env.MYSQL_HOST ?? process.env.HOST;
const port = process.env.MYSQL_PORT;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;
const connectionLimit = Number(process.env.MYSQL_CONNECTION_LIMIT ?? "5");
const missingDbEnvVars = [
  !host ? "MYSQL_HOST" : null,
  !port ? "MYSQL_PORT" : null,
  !user ? "MYSQL_USER" : null,
  !password ? "MYSQL_PASSWORD" : null,
  !database ? "MYSQL_DATABASE" : null,
].filter((value): value is string => Boolean(value));

let pool: mysql.Pool | null = null;

export function isDbConfigured() {
  return missingDbEnvVars.length === 0;
}

export function getMissingDbEnvVars() {
  return [...missingDbEnvVars];
}

function getPool() {
  if (pool) return pool;

  if (!isDbConfigured()) {
    throw new Error(`Missing MySQL environment variables: ${missingDbEnvVars.join(", ")}`);
  }

  pool = mysql.createPool({
    host,
    port: Number(port),
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    maxIdle: 5,
    idleTimeout: 30000,
    namedPlaceholders: true,
  });

  return pool;
}

export async function dbQuery<T = unknown>(
  sql: string,
  params?: Record<string, unknown> | unknown[],
) {
  let lastError: Error | null = null;
  
  // Retry up to 5 times if connection pool is full
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [rows] = await getPool().execute(sql, params ?? []);
      return rows as T;
    } catch (error) {
      lastError = error as Error;
      const isConnError = error instanceof Error && 
        (error.message.includes('Too many connections') || 
         error.message.includes('ER_CON_COUNT_ERROR'));
      
      if (isConnError && attempt < 4) {
        // Wait with exponential backoff before retry (50ms, 100ms, 200ms, 400ms)
        await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError ?? new Error('Query failed');
}

export async function dbHealthcheck() {
  const [rows] = await getPool().query("SELECT 1 AS ok");
  return rows as Array<{ ok: number }>;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Fechar pool ao encerrar o processo
if (typeof process !== "undefined") {
  process.on("SIGTERM", () => {
    closePool().catch(console.error);
  });
  process.on("SIGINT", () => {
    closePool().catch(console.error);
  });
}
