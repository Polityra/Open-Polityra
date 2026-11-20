import { getPool } from "../../config/database";

export const PIPELINE_JOB_TYPES = [
  "source.fetch",
  "document.normalize",
  "document.deduplicate",
  "document.extract_claims",
  "document.extract_entities",
  "document.extract_events",
  "claim.find_evidence",
  "claim.verify",
  "claim.detect_contradictions",
  "analysis.create",
  "analysis.update",
] as const;

export type PipelineJobType = (typeof PIPELINE_JOB_TYPES)[number];

export interface PipelineJob {
  id: string;
  job_type: PipelineJobType;
  payload: Record<string, unknown>;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  run_after: Date;
  last_error: string | null;
  correlation_id: string;
  created_at: Date;
  updated_at: Date;
}

export async function enqueuePipelineJob(params: {
  jobType: PipelineJobType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  priority?: number;
  maxAttempts?: number;
}): Promise<PipelineJob> {
  const result = await getPool().query<PipelineJob>(
    `INSERT INTO pipeline_jobs (
       job_type, payload, idempotency_key, priority, max_attempts
     ) VALUES ($1, $2::jsonb, $3, $4, $5)
     ON CONFLICT (job_type, idempotency_key) DO UPDATE SET
       updated_at = now()
     RETURNING *`,
    [
      params.jobType,
      JSON.stringify({ contractVersion: 1, ...params.payload }),
      params.idempotencyKey,
      params.priority ?? 0,
      params.maxAttempts ?? 5,
    ],
  );
  return result.rows[0];
}

export async function enqueueSourceFetch(sourceId: string): Promise<PipelineJob> {
  const result = await getPool().query<{ id: string; is_active: boolean }>(
    `SELECT id, is_active FROM sources WHERE id = $1`,
    [sourceId],
  );
  const source = result.rows[0];
  if (!source) throw new Error("Source not found");
  if (!source.is_active) throw new Error("Source is disabled");

  return enqueuePipelineJob({
    jobType: "source.fetch",
    payload: { sourceId },
    idempotencyKey: `${sourceId}:${new Date().toISOString().slice(0, 13)}`,
    priority: 10,
  });
}

export async function scheduleEnabledSources(): Promise<number> {
  const result = await getPool().query<{ id: string }>(
    `SELECT id FROM sources
     WHERE is_active = true
       AND (
         metadata->'news_scraper'->>'feedUrl' IS NOT NULL
         OR fetch_config->>'url' IS NOT NULL
       )`,
  );
  await Promise.all(result.rows.map(({ id }) => enqueueSourceFetch(id)));
  return result.rows.length;
}

export async function listPipelineJobs(limit = 50, status?: string): Promise<PipelineJob[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 200);
  const result = await getPool().query<PipelineJob>(
    `SELECT * FROM pipeline_jobs
     WHERE ($2::text IS NULL OR status = $2)
     ORDER BY created_at DESC
     LIMIT $1`,
    [normalizedLimit, status ?? null],
  );
  return result.rows;
}

export async function retryPipelineJob(id: string): Promise<PipelineJob | null> {
  const result = await getPool().query<PipelineJob>(
    `UPDATE pipeline_jobs
     SET status = 'pending', attempts = 0, run_after = now(),
         lease_expires_at = NULL, worker_id = NULL, last_error = NULL,
         completed_at = NULL, updated_at = now()
     WHERE id = $1 AND status IN ('failed', 'dead_letter')
     RETURNING *`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listPipelineWorkers() {
  const result = await getPool().query(
    `SELECT *, last_heartbeat_at > now() - interval '45 seconds' AS healthy
     FROM pipeline_workers ORDER BY last_heartbeat_at DESC`,
  );
  return result.rows;
}
