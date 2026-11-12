import { Pool } from "pg";
import { getPool } from "../../config/database";

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface ReportRow {
  id: string;
  user_id: string | null;
  title: string;
  status: "draft" | "reviewing" | "published";
  format: string;
  content: Record<string, unknown> | null;
  created_at: Date;
}

export async function listReports(userId: string, status?: string, limit = 50, offset = 0) {
  const pool = _getPool();
  const whereClauses: string[] = ["(r.user_id = $1 OR r.user_id IS NULL)"];
  const values: unknown[] = [userId];
  let idx = 2;

  if (status) {
    whereClauses.push(`r.status = $${idx++}`);
    values.push(status);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const countResult = await pool.query(`SELECT COUNT(*) FROM reports r ${whereSql}`, values);
  const result = await pool.query(
    `SELECT r.id, r.title, r.status, r.format, r.content, r.user_id, r.created_at FROM reports r ${whereSql} ORDER BY r.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return {
    rows: result.rows as ReportRow[],
    total: Number(countResult.rows[0].count),
  };
}

export async function createReport(params: {
  userId: string;
  title: string;
  format?: string;
  content?: Record<string, unknown>;
}): Promise<ReportRow> {
  const pool = _getPool();
  const result = await pool.query(
    `INSERT INTO reports (user_id, title, status, format, content) VALUES ($1, $2, 'draft', $3, $4) RETURNING id, user_id, title, status, format, content, created_at`,
    [params.userId, params.title, params.format ?? "json", JSON.stringify(params.content)],
  );
  return result.rows[0] as ReportRow;
}

export async function getReportById(id: string, userId: string): Promise<ReportRow | null> {
  const pool = _getPool();
  const result = await pool.query(
    `SELECT id, user_id, title, status, format, content, created_at
     FROM reports WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
    [id, userId],
  );
  return result.rows[0] ?? null;
}
