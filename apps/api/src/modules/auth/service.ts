import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { getPool } from '../../config/database';
import { UnauthorizedError, ValidationError } from '../../errors/appError';

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export async function createSession(userId: string, plaintextToken: string): Promise<SessionRow> {
  const pool = _getPool();
  const tokenHash = await bcrypt.hash(plaintextToken, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const result = await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING id, user_id, created_at, expires_at`,
    [userId, tokenHash, expiresAt],
  );
  return result.rows[0] as SessionRow;
}

export async function invalidateSession(tokenHash: string): Promise<boolean> {
  const pool = _getPool();
  const result = await pool.query('DELETE FROM sessions WHERE token_hash = $1 RETURNING id', [tokenHash]);
  return result.rowCount !== null && result.rowCount > 0;
}

export async function validateSession(token: string): Promise<SessionRow | null> {
  const pool = _getPool();
  const result = await pool.query(
    'SELECT id, user_id, token_hash, expires_at, created_at FROM sessions WHERE expires_at > NOW()',
  );
  for (const row of result.rows as SessionRow[]) {
    const valid = await bcrypt.compare(token, row.token_hash);
    if (valid) return row;
  }
  return null;
}

export async function logoutByUserId(userId: string): Promise<void> {
  const pool = _getPool();
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}
