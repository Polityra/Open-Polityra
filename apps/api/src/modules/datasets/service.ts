import { Pool } from "pg";
import { getPool } from "../../config/database";

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface DatasetRow {
  id: string;
  source_id: string;
  name: string;
  format: string;
  size_bytes: number | null;
  created_at: Date;
}

export async function listDatasets(sourceId?: string, limit = 50, offset = 0) {
  const pool = _getPool();
  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (sourceId) {
    whereClauses.push(`d.source_id = $${idx++}`);
    values.push(sourceId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT d.id, d.name, d.format, d.size_bytes, d.source_id, d.created_at FROM datasets d ${whereSql} ORDER BY d.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return result.rows as DatasetRow[];
}

export async function getDatasetById(id: string): Promise<DatasetRow | null> {
  const pool = _getPool();
  const result = await pool.query(
    "SELECT id, name, format, size_bytes, source_id, created_at FROM datasets WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}
