import { Pool } from 'pg';
import { getEnv } from './env';
import type { Env } from './env';

let pool: Pool | null = null;

export function getPool(env?: Env): Pool {
  if (pool) return pool;
  const cfg = env ?? getEnv();
  pool = new Pool({
    connectionString: cfg.DATABASE_URL,
    max: process.env.VERCEL ? 1 : 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
