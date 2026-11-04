import { Pool } from 'pg';
import { getPool } from '../../config/database';

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface ForecastRow {
  id: string;
  analysis_id: string;
  target: string;
  method: string;
  values: Record<string, unknown> | null;
  confidence_lower: number | null;
  confidence_upper: number | null;
  created_at: Date;
}

export async function listForecasts(analysisId?: string, limit = 50, offset = 0): Promise<ForecastRow[]> {
  const pool = _getPool();
  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (analysisId) {
    whereClauses.push(`f.analysis_id = $${idx++}`);
    values.push(analysisId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT f.id, f.analysis_id, f.target, f.method, f.values, f.confidence_lower, f.confidence_upper, f.created_at FROM forecasts f ${whereSql} ORDER BY f.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return result.rows as ForecastRow[];
}

export async function createForecast(params: { analysisId: string; target: string; method: string; values?: Record<string, unknown>; confidenceLower?: number; confidenceUpper?: number }): Promise<ForecastRow> {
  const pool = _getPool();
  const result = await pool.query(
    `INSERT INTO forecasts (analysis_id, target, method, values, confidence_lower, confidence_upper) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, analysis_id, target, method, values, confidence_lower, confidence_upper, created_at`,
    [params.analysisId, params.target, params.method, JSON.stringify(params.values), params.confidenceLower ?? null, params.confidenceUpper ?? null],
  );
  return result.rows[0] as ForecastRow;
}
