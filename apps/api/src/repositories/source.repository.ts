import { Pool } from "pg";
import { getPool } from "../config/database";

export interface SourceRow {
  id: string;
  name: string;
  publisher: string | null;
  license: string | null;
  data_type: string;
  source_type: string;
  category: string;
  canonical_url: string | null;
  geographic_scope: unknown[];
  language: string | null;
  source_classification: string | null;
  reliability_metadata: Record<string, unknown>;
  fetch_config: Record<string, unknown>;
  last_successful_fetch: Date | null;
  last_failed_fetch: Date | null;
  metadata: Record<string, unknown> | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class SourceRepository {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  async findAll(
    limit = 50,
    offset = 0,
    categoryFilter?: string,
    topicFilter?: string,
  ): Promise<{ rows: SourceRow[]; total: number }> {
    const whereClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (categoryFilter) {
      whereClauses.push(`category = $${idx++}`);
      values.push(categoryFilter);
    }
    if (topicFilter) {
      whereClauses.push(`metadata #> '{news_scraper,topics}' ? $${idx++}`);
      values.push(topicFilter);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const countResult = await this.pool.query(`SELECT COUNT(*) FROM sources ${whereSql}`, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await this.pool.query(
      `SELECT id, name, publisher, license, data_type, source_type, category, canonical_url,
              geographic_scope, language, source_classification, reliability_metadata,
              fetch_config, last_successful_fetch, last_failed_fetch, metadata, is_active,
              created_at, updated_at
       FROM sources ${whereSql} ORDER BY updated_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );
    return { rows: result.rows as SourceRow[], total };
  }

  async findById(id: string): Promise<SourceRow | null> {
    const result = await this.pool.query(
      `SELECT id, name, publisher, license, data_type, source_type, category, canonical_url,
              geographic_scope, language, source_classification, reliability_metadata,
              fetch_config, last_successful_fetch, last_failed_fetch, metadata, is_active,
              created_at, updated_at
       FROM sources WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async create(params: {
    name: string;
    publisher?: string;
    license?: string;
    dataType: string;
    sourceType?: string;
    category: string;
    canonicalUrl?: string;
    language?: string;
    geographicScope?: string[];
    sourceClassification?: string;
    reliabilityMetadata?: Record<string, unknown>;
    fetchConfig?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<SourceRow> {
    const result = await this.pool.query(
      `INSERT INTO sources (
         name, publisher, license, data_type, source_type, category, canonical_url,
         geographic_scope, language, source_classification, reliability_metadata,
         fetch_config, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb, $12::jsonb, $13)
       RETURNING id, name, publisher, license, data_type, source_type, category, canonical_url,
         geographic_scope, language, source_classification, reliability_metadata,
         fetch_config, last_successful_fetch, last_failed_fetch, metadata, is_active,
         created_at, updated_at`,
      [
        params.name,
        params.publisher ?? null,
        params.license ?? null,
        params.dataType,
        params.sourceType ?? params.dataType,
        params.category,
        params.canonicalUrl ?? null,
        JSON.stringify(params.geographicScope ?? []),
        params.language ?? null,
        params.sourceClassification ?? null,
        JSON.stringify(params.reliabilityMetadata ?? {}),
        JSON.stringify(params.fetchConfig ?? {}),
        params.metadata,
      ],
    );
    return result.rows[0] as SourceRow;
  }

  async update(
    id: string,
    updates: Partial<
      Pick<
        SourceRow,
        | "name"
        | "publisher"
        | "license"
        | "canonical_url"
        | "metadata"
        | "is_active"
        | "geographic_scope"
        | "language"
        | "source_classification"
        | "reliability_metadata"
        | "fetch_config"
      >
    >,
  ): Promise<SourceRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.publisher !== undefined) {
      fields.push(`publisher = $${idx++}`);
      values.push(updates.publisher);
    }
    if (updates.license !== undefined) {
      fields.push(`license = $${idx++}`);
      values.push(updates.license);
    }
    if (updates.canonical_url !== undefined) {
      fields.push(`canonical_url = $${idx++}`);
      values.push(updates.canonical_url);
    }
    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${idx++}::jsonb`);
      values.push(JSON.stringify(updates.metadata));
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(updates.is_active);
    }
    if (updates.geographic_scope !== undefined) {
      fields.push(`geographic_scope = $${idx++}::jsonb`);
      values.push(JSON.stringify(updates.geographic_scope));
    }
    if (updates.language !== undefined) {
      fields.push(`language = $${idx++}`);
      values.push(updates.language);
    }
    if (updates.source_classification !== undefined) {
      fields.push(`source_classification = $${idx++}`);
      values.push(updates.source_classification);
    }
    if (updates.reliability_metadata !== undefined) {
      fields.push(`reliability_metadata = $${idx++}::jsonb`);
      values.push(JSON.stringify(updates.reliability_metadata));
    }
    if (updates.fetch_config !== undefined) {
      fields.push(`fetch_config = $${idx++}::jsonb`);
      values.push(JSON.stringify(updates.fetch_config));
    }

    if (fields.length === 0) return null;

    fields.push("updated_at = NOW()");
    const sql = `UPDATE sources SET ${fields.join(", ")} WHERE id = $${idx}
      RETURNING id, name, publisher, license, data_type, source_type, category, canonical_url,
        geographic_scope, language, source_classification, reliability_metadata, fetch_config,
        last_successful_fetch, last_failed_fetch, metadata, is_active, created_at, updated_at`;
    values.push(id);

    const result = await this.pool.query(sql, values);
    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM sources WHERE id = $1 RETURNING id", [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
