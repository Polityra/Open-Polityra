import { Pool } from "pg";
import { getPool } from "../../config/database";

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface ForecastRow {
  id: string;
  analysis_id: string | null;
  target: string;
  method: string;
  values: Record<string, unknown> | null;
  confidence_lower: number | null;
  confidence_upper: number | null;
  created_at: Date;
}

export async function listForecasts(
  analysisId?: string,
  limit = 50,
  offset = 0,
  userId?: string,
): Promise<{ rows: ForecastRow[]; total: number }> {
  const pool = _getPool();
  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (userId) {
    whereClauses.push(`a.user_id = $${idx++}`);
    values.push(userId);
  }
  if (analysisId) {
    whereClauses.push(`f.analysis_id = $${idx++}`);
    values.push(analysisId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM forecasts f LEFT JOIN analyses a ON a.id = f.analysis_id ${whereSql}`,
    values,
  );
  const result = await pool.query(
    `SELECT f.id, f.analysis_id, f.target, f.method, f.values, f.confidence_lower, f.confidence_upper, f.created_at FROM forecasts f LEFT JOIN analyses a ON a.id = f.analysis_id ${whereSql} ORDER BY f.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return { rows: result.rows as ForecastRow[], total: Number(countResult.rows[0].count) };
}

export async function createForecast(params: {
  analysisId: string;
  target: string;
  method: string;
  values?: Record<string, unknown>;
  confidenceLower?: number;
  confidenceUpper?: number;
}): Promise<ForecastRow> {
  const pool = _getPool();
  const result = await pool.query(
    `INSERT INTO forecasts (analysis_id, target, method, values, confidence_lower, confidence_upper) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, analysis_id, target, method, values, confidence_lower, confidence_upper, created_at`,
    [
      params.analysisId,
      params.target,
      params.method,
      JSON.stringify(params.values),
      params.confidenceLower ?? null,
      params.confidenceUpper ?? null,
    ],
  );
  return result.rows[0] as ForecastRow;
}
