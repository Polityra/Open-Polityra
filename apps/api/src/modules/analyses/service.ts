import { Pool } from "pg";
import { getPool } from "../../config/database";
import { AppError } from "../../errors/appError";
import { PythonServiceClient } from "../../services/pythonServiceClient";
import type { AnalysisRequest, AnalysisResult } from "../../services/pythonServiceClient";
import type { RunAnalysisInput } from "./schema";

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

export interface AnalysisRow {
  id: string;
  user_id: string | null;
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  parameters: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
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
    whereClauses.push(`(a.user_id = $${idx++} OR a.user_id IS NULL)`);
    values.push(userId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const countResult = await pool.query(`SELECT COUNT(*) FROM analyses a ${whereSql}`, values);
  const result = await pool.query(
    `SELECT id, user_id, title, status, parameters, result_id, result, error_message, created_at, updated_at FROM analyses a ${whereSql} ORDER BY updated_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset],
  );
  return { rows: result.rows as AnalysisRow[], total: Number(countResult.rows[0].count) };
}

export async function createAnalysis(
  userId: string,
  request: RunAnalysisInput,
): Promise<AnalysisRow> {
  const pool = _getPool();
  const result = await pool.query(
    `INSERT INTO analyses (user_id, title, status, parameters) VALUES ($1, $2, 'pending', $3) RETURNING id, user_id, title, status, parameters, result_id, result, error_message, created_at, updated_at`,
    [userId, request.title ?? request.topic, JSON.stringify(request)],
  );
  return result.rows[0] as AnalysisRow;
}

export async function submitAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  const client = new PythonServiceClient();
  return client.submitAnalysis(request);
}

export async function executeAnalysis(
  userId: string,
  input: RunAnalysisInput,
): Promise<AnalysisRow> {
  const analysis = await createAnalysis(userId, input);
  const pool = _getPool();
  await pool.query("UPDATE analyses SET status = 'running', updated_at = now() WHERE id = $1", [
    analysis.id,
  ]);

  try {
    const sourceRows = input.sourceIds.length
      ? await pool.query(
          `SELECT id, name, publisher, category, description, canonical_url
           FROM sources WHERE id = ANY($1::uuid[]) ORDER BY name`,
          [input.sourceIds],
        )
      : { rows: [] };
    const indicatorRows = input.indicatorIds.length
      ? await pool.query(
          `SELECT id, name, category, unit, frequency, description
           FROM indicators WHERE id = ANY($1::uuid[]) ORDER BY name`,
          [input.indicatorIds],
        )
      : { rows: [] };
    const reportRows = input.reportIds.length
      ? await pool.query(
          `SELECT id, title, status, format, content, created_at
           FROM reports
           WHERE id = ANY($1::uuid[]) AND (user_id = $2 OR user_id IS NULL)
           ORDER BY created_at DESC`,
          [input.reportIds, userId],
        )
      : { rows: [] };
    const scenarioRows = input.scenarioIds.length
      ? await pool.query(
          `SELECT id, name, description, assumptions, parameters, created_at
           FROM scenarios
           WHERE id = ANY($1::uuid[]) AND (created_by = $2 OR created_by IS NULL)
           ORDER BY created_at DESC`,
          [input.scenarioIds, userId],
        )
      : { rows: [] };
    const requestedRecords = [
      [input.sourceIds.length, sourceRows.rows.length],
      [input.indicatorIds.length, indicatorRows.rows.length],
      [input.reportIds.length, reportRows.rows.length],
      [input.scenarioIds.length, scenarioRows.rows.length],
    ];
    if (requestedRecords.some(([requested, found]) => requested !== found)) {
      throw new AppError(
        404,
        "analysis_records_unavailable",
        "One or more selected database records were not found or are not accessible.",
      );
    }
    const databaseContext = [
      input.context?.trim(),
      sourceRows.rows.length
        ? `Sources from the database:\n${JSON.stringify(sourceRows.rows)}`
        : "",
      indicatorRows.rows.length
        ? `Indicators from the database:\n${JSON.stringify(indicatorRows.rows)}`
        : "",
      reportRows.rows.length
        ? `Reports from the database:\n${JSON.stringify(reportRows.rows)}`
        : "",
      scenarioRows.rows.length
        ? `Scenarios from the database:\n${JSON.stringify(scenarioRows.rows)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 30_000);

    if (!databaseContext && !input.observations?.length) {
      throw new AppError(
        400,
        "analysis_context_missing",
        "Select at least one database source or indicator, or provide context.",
      );
    }

    const request: AnalysisRequest = {
      topic: input.topic,
      context: databaseContext || undefined,
      observations: input.observations,
      scope: input.scope,
      time_horizon: input.time_horizon,
      methodology: input.methodology,
      enable_ai_synthesis: input.enable_ai_synthesis,
    };
    const result = await submitAnalysis(request);
    const updated = await updateAnalysis(
      analysis.id,
      "completed",
      result as Record<string, unknown>,
    );
    if (!updated) throw new Error(`Analysis ${analysis.id} disappeared before it was saved.`);
    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateAnalysis(analysis.id, "failed", undefined, message.slice(0, 2048));
    throw error;
  }
}

export async function updateAnalysis(
  id: string,
  status: AnalysisRow["status"],
  result?: Record<string, unknown>,
  errorMessage?: string,
): Promise<AnalysisRow | null> {
  const pool = _getPool();
  const updated = await pool.query(
    `UPDATE analyses
     SET status = $2, result = $3, error_message = $4, updated_at = now()
     WHERE id = $1
     RETURNING id, user_id, title, status, parameters, result_id, result, error_message, created_at, updated_at`,
    [id, status, result ? JSON.stringify(result) : null, errorMessage ?? null],
  );
  return (updated.rows[0] as AnalysisRow | undefined) ?? null;
}

export async function getAnalysisStatus(id: string, userId: string): Promise<AnalysisRow | null> {
  const pool = _getPool();
  const result = await pool.query(
    "SELECT id, user_id, title, status, parameters, result_id, result, error_message, created_at, updated_at FROM analyses WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)",
    [id, userId],
  );
  return (result.rows[0] as AnalysisRow | undefined) ?? null;
}
