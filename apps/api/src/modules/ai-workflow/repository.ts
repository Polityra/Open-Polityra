import { Pool } from "pg";
import { getPool } from "../../config/database";
import type { AiWorkflowType } from "./schema";

let cachedPool: Pool | null = null;

function _getPool(): Pool {
  if (cachedPool) return cachedPool;
  cachedPool = getPool();
  return cachedPool;
}

/* ── Workflow rows ─────────────────────────────────────────── */

export interface AiWorkflowRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  model: string;
  provider: string;
  system_prompt: string | null;
  parameters: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowTaskRow {
  id: string;
  workflow_id: string;
  title: string;
  description: string | null;
  step_order: number;
  status: string;
  prompt: string | null;
  response: string | Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  error_message: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AiConversationRow {
  id: string;
  workflow_id: string | null;
  title: string | null;
  messages: Record<string, unknown>[];
  created_at: Date;
  updated_at: Date;
}

/* ── Workflow CRUD ─────────────────────────────────────────── */

export class AiWorkflowRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? _getPool();
  }

  async create(params: {
    userId: string;
    title: string;
    description?: string;
    type: AiWorkflowType;
    model?: string;
    provider?: string;
    systemPrompt?: string;
    parameters?: Record<string, unknown>;
  }): Promise<AiWorkflowRow> {
    const result = await this.pool.query(
      `INSERT INTO ai_workflows (user_id, title, description, type, status, model, provider, system_prompt, parameters)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
       RETURNING id, user_id, title, description, type, status, model, provider, system_prompt, parameters, result, error_message, started_at, completed_at, created_at, updated_at`,
      [
        params.userId,
        params.title,
        params.description ?? null,
        params.type,
        params.model ?? "qwen3:0.6b",
        params.provider ?? "ollama",
        params.systemPrompt ?? null,
        JSON.stringify(params.parameters ?? {}),
      ],
    );
    return formatWorkflowRow(result.rows[0]);
  }

  async findById(id: string): Promise<AiWorkflowRow | null> {
    const result = await this.pool.query(
      "SELECT id, user_id, title, description, type, status, model, provider, system_prompt, parameters, result, error_message, started_at, completed_at, created_at, updated_at FROM ai_workflows WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ? formatWorkflowRow(result.rows[0]) : null;
  }

  async findAll(
    userId: string,
    params?: { status?: string; type?: string; limit?: number; offset?: number },
  ): Promise<{ rows: AiWorkflowRow[]; total: number }> {
    const whereClauses: string[] = ["aw.user_id = $1"];
    const values: unknown[] = [userId];
    let idx = 2;

    if (params?.status) {
      whereClauses.push("aw.status = $" + idx);
      values.push(params.status);
      idx++;
    }
    if (params?.type) {
      whereClauses.push("aw.type = $" + idx);
      values.push(params.type);
      idx++;
    }

    const whereSql = "WHERE " + whereClauses.join(" AND ");
    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM ai_workflows aw ${whereSql}`,
      values,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Add limit/offset parameters
    const pIdx = idx;
    const result = await this.pool.query(
      `SELECT aw.id, aw.user_id, aw.title, aw.description, aw.type, aw.status, aw.model, aw.provider, aw.system_prompt, aw.parameters, aw.result, aw.error_message, aw.started_at, aw.completed_at, aw.created_at, aw.updated_at
       FROM ai_workflows aw ${whereSql} ORDER BY aw.updated_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
      [...values, limit, offset],
    );

    return { rows: result.rows.map(formatWorkflowRow), total };
  }

  async updateStatus(
    id: string,
    status: string,
    extras?: {
      result?: Record<string, unknown>;
      errorMessage?: string;
      startedAt?: Date;
      completedAt?: Date;
    },
  ): Promise<AiWorkflowRow | null> {
    const fields: string[] = ["status = $1"];
    const values: unknown[] = [status];
    let idx = 2;

    if (extras?.startedAt !== undefined) {
      fields.push(`started_at = $${idx++}`);
      values.push(extras.startedAt);
    }
    if (extras?.completedAt !== undefined) {
      fields.push(`completed_at = $${idx++}`);
      values.push(extras.completedAt);
    }
    if (extras?.result !== undefined) {
      fields.push(`result = $${idx++}`);
      values.push(JSON.stringify(extras.result));
    }
    if (extras?.errorMessage !== undefined) {
      fields.push(`error_message = $${idx++}`);
      values.push(extras.errorMessage);
    }

    const sql = `UPDATE ai_workflows SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, user_id, title, description, type, status, model, provider, system_prompt, parameters, result, error_message, started_at, completed_at, created_at, updated_at`;
    values.push(id);

    const result = await this.pool.query(sql, values);
    return result.rows[0] ? formatWorkflowRow(result.rows[0]) : null;
  }

  async updateResult(
    id: string,
    resultData: Record<string, unknown>,
  ): Promise<AiWorkflowRow | null> {
    const queryResult = await this.pool.query(
      "UPDATE ai_workflows SET result = $1, updated_at = now() WHERE id = $2 RETURNING id, user_id, title, description, type, status, model, provider, system_prompt, parameters, result, error_message, started_at, completed_at, created_at, updated_at",
      [JSON.stringify(resultData), id],
    );
    return queryResult.rows[0] ? formatWorkflowRow(queryResult.rows[0]) : null;
  }

  async update(
    id: string,
    updates: Partial<Pick<AiWorkflowRow, "title" | "description" | "parameters">>,
  ): Promise<AiWorkflowRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(updates.description);
    }
    if (updates.parameters !== undefined) {
      fields.push(`parameters = $${idx++}`);
      values.push(JSON.stringify(updates.parameters));
    }

    if (fields.length === 0) return null;

    fields.push("updated_at = now()");
    const sql = `UPDATE ai_workflows SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, user_id, title, description, type, status, model, provider, system_prompt, parameters, result, error_message, started_at, completed_at, created_at, updated_at`;
    values.push(id);

    const res = await this.pool.query(sql, values);
    return res.rows[0] ? formatWorkflowRow(res.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM ai_workflows WHERE id = $1 RETURNING id", [
      id,
    ]);
    return result.rows.length > 0;
  }

  async startWorkflow(id: string): Promise<AiWorkflowRow | null> {
    const result = await this.pool.query(
      "UPDATE ai_workflows SET status = 'running', started_at = now(), updated_at = now() WHERE id = $1 RETURNING id, user_id, title, description, type, status, model, provider, system_prompt, parameters, result, error_message, started_at, completed_at, created_at, updated_at",
      [id],
    );
    return result.rows[0] ? formatWorkflowRow(result.rows[0]) : null;
  }
}

/* ── Task CRUD ─────────────────────────────────────────────── */

export class WorkflowTaskRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? _getPool();
  }

  async create(params: {
    workflowId: string;
    title: string;
    description?: string;
    stepOrder: number;
    prompt?: string;
    metadata?: Record<string, unknown>;
  }): Promise<WorkflowTaskRow> {
    const result = await this.pool.query(
      `INSERT INTO workflow_tasks (workflow_id, title, description, step_order, prompt, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, workflow_id, title, description, step_order, status, prompt, response, metadata, error_message, started_at, completed_at, created_at, updated_at`,
      [
        params.workflowId,
        params.title,
        params.description ?? null,
        params.stepOrder,
        params.prompt ?? null,
        JSON.stringify(params.metadata ?? {}),
      ],
    );
    return formatTaskRow(result.rows[0]);
  }

  async findByWorkflow(workflowId: string): Promise<WorkflowTaskRow[]> {
    const result = await this.pool.query(
      "SELECT id, workflow_id, title, description, step_order, status, prompt, response, metadata, error_message, started_at, completed_at, created_at, updated_at FROM workflow_tasks WHERE workflow_id = $1 ORDER BY step_order ASC",
      [workflowId],
    );
    return result.rows.map(formatTaskRow);
  }

  async update(
    id: string,
    status: string,
    extras?: {
      response?: string | Record<string, unknown>;
      errorMessage?: string;
      startedAt?: Date;
      completedAt?: Date;
    },
  ): Promise<WorkflowTaskRow | null> {
    const fields: string[] = ["status = $1"];
    const values: unknown[] = [status];
    let idx = 2;

    if (extras?.startedAt !== undefined) {
      fields.push(`started_at = $${idx++}`);
      values.push(extras.startedAt);
    }
    if (extras?.completedAt !== undefined) {
      fields.push(`completed_at = $${idx++}`);
      values.push(extras.completedAt);
    }
    if (extras?.response !== undefined) {
      fields.push(`response = $${idx++}`);
      values.push(JSON.stringify(extras.response));
    }
    if (extras?.errorMessage !== undefined) {
      fields.push(`error_message = $${idx++}`);
      values.push(extras.errorMessage);
    }

    const sql = `UPDATE workflow_tasks SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, workflow_id, title, description, step_order, status, prompt, response, metadata, error_message, started_at, completed_at, created_at, updated_at`;
    values.push(id);

    const result = await this.pool.query(sql, values);
    return result.rows[0] ? formatTaskRow(result.rows[0]) : null;
  }
}

/* ── Conversation CRUD ─────────────────────────────────────── */

export class AiConversationRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? _getPool();
  }

  async create(params: { workflowId?: string; title?: string }): Promise<AiConversationRow> {
    const result = await this.pool.query(
      "INSERT INTO ai_conversations (workflow_id, title, messages) VALUES ($1, $2, '[]') RETURNING id, workflow_id, title, messages, created_at, updated_at",
      [params.workflowId ?? null, params.title ?? null],
    );
    return result.rows[0];
  }

  async addMessage(
    conversationId: string,
    message: Record<string, unknown>,
  ): Promise<AiConversationRow> {
    const result = await this.pool.query(
      `UPDATE ai_conversations SET messages = jsonb_array_elements(messages || to_jsonb($1::jsonb))::jsonb[], updated_at = now()
       WHERE id = $2 RETURNING id, workflow_id, title, messages, created_at, updated_at`,
      [JSON.stringify(message), conversationId],
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<AiConversationRow | null> {
    const result = await this.pool.query(
      "SELECT id, workflow_id, title, messages, created_at, updated_at FROM ai_conversations WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByWorkflow(workflowId: string): Promise<AiConversationRow[]> {
    const result = await this.pool.query(
      "SELECT id, workflow_id, title, messages, created_at, updated_at FROM ai_conversations WHERE workflow_id = $1 ORDER BY updated_at DESC",
      [workflowId],
    );
    return result.rows;
  }
}

/* ── Helpers ───────────────────────────────────────────────── */

function formatWorkflowRow(raw: Record<string, unknown>): AiWorkflowRow {
  const p = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);
  return {
    id: raw.id as string,
    user_id: raw.user_id as string,
    title: raw.title as string,
    description: raw.description as string | null,
    type: raw.type as string,
    status: raw.status as string,
    model: raw.model as string,
    provider: raw.provider as string,
    system_prompt: raw.system_prompt as string | null,
    parameters: (raw.parameters ? p(raw.parameters) : {}) as Record<string, unknown>,
    result: (raw.result ? p(raw.result) : null) as Record<string, unknown> | null,
    error_message: raw.error_message as string | null,
    started_at: raw.started_at instanceof Date ? raw.started_at : null,
    completed_at: raw.completed_at instanceof Date ? raw.completed_at : null,
    created_at: raw.created_at as Date,
    updated_at: raw.updated_at as Date,
  };
}

function formatTaskRow(raw: Record<string, unknown>): WorkflowTaskRow {
  const p = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);
  return {
    id: raw.id as string,
    workflow_id: raw.workflow_id as string,
    title: raw.title as string,
    description: raw.description as string | null,
    step_order: raw.step_order as number,
    status: raw.status as string,
    prompt: raw.prompt as string | null,
    response:
      raw.response == null
        ? null
        : typeof raw.response === "string"
          ? raw.response
          : (p(raw.response) as Record<string, unknown>),
    metadata: (raw.metadata ? p(raw.metadata) : {}) as Record<string, unknown> | null,
    error_message: raw.error_message as string | null,
    started_at: raw.started_at instanceof Date ? raw.started_at : null,
    completed_at: raw.completed_at instanceof Date ? raw.completed_at : null,
    created_at: raw.created_at as Date,
    updated_at: raw.updated_at as Date,
  };
}
