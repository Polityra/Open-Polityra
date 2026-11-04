import { Pool } from 'pg';
import { getPool } from '../../config/database';

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface ScenarioRow {
  id: string;
  name: string;
  description: string | null;
  assumptions: Record<string, unknown> | null;
  parameters: Record<string, unknown> | null;
  created_by: string;
  created_at: Date;
}

export async function listScenarios(limit = 50, offset = 0) {
  const pool = _getPool();
  const result = await pool.query(
    'SELECT id, name, description, assumptions, parameters, created_by, created_at FROM scenarios ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  );
  return result.rows as ScenarioRow[];
}

export async function createScenario(params: { name: string; description?: string; assumptions?: Record<string, unknown>; parameters?: Record<string, unknown>; createdBy: string }): Promise<ScenarioRow> {
  const pool = _getPool();
  const result = await pool.query(
    `INSERT INTO scenarios (name, description, assumptions, parameters, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, assumptions, parameters, created_by, created_at`,
    [params.name, params.description ?? null, JSON.stringify(params.assumptions), JSON.stringify(params.parameters), params.createdBy],
  );
  return result.rows[0] as ScenarioRow;
}

export async function getScenarioById(id: string): Promise<ScenarioRow | null> {
  const pool = _getPool();
  const result = await pool.query('SELECT id, name, description, assumptions, parameters, created_by, created_at FROM scenarios WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function updateScenario(id: string, updates: Partial<Pick<ScenarioRow, 'name' | 'description' | 'assumptions' | 'parameters'>>): Promise<ScenarioRow | null> {
  const pool = _getPool();
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
  if (updates.assumptions !== undefined) { fields.push(`assumptions = $${idx++}::jsonb`); values.push(JSON.stringify(updates.assumptions)); }
  if (updates.parameters !== undefined) { fields.push(`parameters = $${idx++}::jsonb`); values.push(JSON.stringify(updates.parameters)); }

  if (fields.length === 0) return null;

  const sql = `UPDATE scenarios SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, description, assumptions, parameters, created_by, created_at`;
  values.push(id);
  const result = await pool.query(sql, values);
  return result.rows[0] ?? null;
}
