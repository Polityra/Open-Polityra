import { Pool } from 'pg';
import { getPool } from '../../config/database';
import { PythonServiceClient } from '../../services/pythonServiceClient';
import type { AnalysisRequest, AnalysisResult } from '../../services/pythonServiceClient';

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface AnalysisRow {
  id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters: Record<string, unknown> | null;
  result_id: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function listAnalyses(userId?: string, limit = 20, offset = 0) {
  const pool = _getPool();
  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (userId) {
    whereClauses.push(`a.user_id = $${idx++}`);
    values.push(userId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT id, user_id, status, parameters, result_id, error_message, created_at, updated_at FROM analyses ${whereSql} ORDER BY updated_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return result.rows as AnalysisRow[];
}

export async function createAnalysis(userId: string, request: AnalysisRequest): Promise<AnalysisRow> {
  const pool = _getPool();
  const result = await pool.query(
    `INSERT INTO analyses (user_id, status, parameters) VALUES ($1, 'pending', $2) RETURNING id, user_id, status, parameters, result_id, error_message, created_at, updated_at`,
    [userId, JSON.stringify(request)],
  );
  return result.rows[0] as AnalysisRow;
}

export async function submitAnalysis(userId: string, request: AnalysisRequest): Promise<AnalysisResult> {
  const client = new PythonServiceClient();
  return client.submitAnalysis(request);
}

export async function getAnalysisStatus(id: string): Promise<{ status: string; result?: unknown }> {
  const pool = _getPool();
  const result = await pool.query('SELECT status, result_id, error_message FROM analyses WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new Error('Analysis not found');

  const row = result.rows[0] as Pick<AnalysisRow, 'status' | 'result_id' | 'error_message'>;
  return { status: row.status, result: row.error_message ? { error: row.error_message } : row.result_id };
}
