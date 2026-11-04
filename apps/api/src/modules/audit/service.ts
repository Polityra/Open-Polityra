import { Pool } from 'pg';
import { getPool } from '../../config/database';

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface AuditLogRow {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
}

export async function logEntry(params: { userId: string; action: string; resourceType: string; details?: Record<string, unknown>; ipAddress?: string }): Promise<void> {
  const pool = _getPool();
  await pool.query(
    `INSERT INTO audit_log (user_id, action, resource_type, details, ip_address) VALUES ($1, $2, $3, $4, $5)`,
    [params.userId, params.action, params.resourceType, JSON.stringify(params.details ?? {}), params.ipAddress ?? null],
  );
}

export async function getAuditLogs(limit = 50, offset = 0, resourceType?: string): Promise<AuditLogRow[]> {
  const pool = _getPool();
  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (resourceType) {
    whereClauses.push(`resource_type = $${idx++}`);
    values.push(resourceType);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT id, user_id, action, resource_type, details, ip_address, created_at FROM audit_log ${whereSql} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return result.rows as AuditLogRow[];
}
