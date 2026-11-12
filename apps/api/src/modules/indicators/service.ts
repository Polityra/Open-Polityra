import { Pool } from "pg";
import { getPool } from "../../config/database";

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface IndicatorRow {
  id: string;
  source_id: string;
  name: string;
  category: string;
  unit: string | null;
  frequency: string | null;
  description: string | null;
  created_at: Date;
}

export async function listIndicators(category?: string, limit = 50, offset = 0) {
  const pool = _getPool();
  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (category) {
    whereClauses.push(`i.category = $${idx++}`);
    values.push(category);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT i.id, i.name, i.category, i.unit, i.frequency, i.description, i.source_id, i.created_at FROM indicators i ${whereSql} ORDER BY i.name LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return result.rows as IndicatorRow[];
}

export async function countIndicators(category?: string): Promise<number> {
  const pool = _getPool();
  const result = await pool.query(
    category
      ? "SELECT COUNT(*) FROM indicators WHERE category = $1"
      : "SELECT COUNT(*) FROM indicators",
    category ? [category] : [],
  );
  return Number(result.rows[0].count);
}

export async function getIndicatorById(id: string): Promise<IndicatorRow | null> {
  const pool = _getPool();
  const result = await pool.query(
    "SELECT id, name, category, unit, frequency, description, source_id, created_at FROM indicators WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}
