import { Pool } from "pg";
import { getPool } from "../../config/database";

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface ModelRegistryRow {
  id: string;
  name: string;
  provider: string;
  version: string;
  capabilities: Record<string, unknown> | null;
  limitations: string[] | null;
  license: string | null;
  is_active: boolean;
  created_at: Date;
}

export async function listModels(
  isActive?: boolean,
  limit = 50,
  offset = 0,
): Promise<ModelRegistryRow[]> {
  const pool = _getPool();
  const whereClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (isActive !== undefined) {
    whereClauses.push(`is_active = $${idx++}`);
    values.push(isActive);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT id, name, provider, version, capabilities, limitations, license, is_active, created_at FROM model_registry ${whereSql} ORDER BY name LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return result.rows as ModelRegistryRow[];
}

export async function getModelById(id: string): Promise<ModelRegistryRow | null> {
  const pool = _getPool();
  const result = await pool.query(
    "SELECT id, name, provider, version, capabilities, limitations, license, is_active, created_at FROM model_registry WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function registerModel(params: {
  name: string;
  provider: string;
  version: string;
  capabilities?: Record<string, unknown>;
  limitations?: string[];
  license?: string;
}): Promise<ModelRegistryRow> {
  const pool = _getPool();
  const result = await pool.query(
    `INSERT INTO model_registry (name, provider, version, capabilities, limitations, license) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, provider, version, capabilities, limitations, license, is_active, created_at`,
    [
      params.name,
      params.provider,
      params.version,
      JSON.stringify(params.capabilities),
      params.limitations ?? null,
      params.license,
    ],
  );
  return result.rows[0] as ModelRegistryRow;
}
