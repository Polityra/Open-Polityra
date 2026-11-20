import { getPool } from "../../config/database";

export async function listDocuments(limit: number, offset: number, sourceId?: string) {
  const normalizedLimit = Math.min(Math.max(limit, 1), 200);
  const normalizedOffset = Math.max(offset, 0);
  const [items, count] = await Promise.all([
    getPool().query(
      `SELECT d.*, s.name AS source_name, s.publisher AS source_publisher
       FROM documents d
       JOIN sources s ON s.id = d.source_id
       WHERE ($3::uuid IS NULL OR d.source_id = $3)
       ORDER BY d.published_at DESC NULLS LAST, d.ingested_at DESC
       LIMIT $1 OFFSET $2`,
      [normalizedLimit, normalizedOffset, sourceId ?? null],
    ),
    getPool().query(`SELECT COUNT(*) FROM documents WHERE ($1::uuid IS NULL OR source_id = $1)`, [
      sourceId ?? null,
    ]),
  ]);
  return { items: items.rows, total: Number(count.rows[0].count) };
}

export async function getDocument(id: string) {
  const result = await getPool().query(
    `SELECT d.*, s.name AS source_name, s.publisher AS source_publisher,
       (SELECT jsonb_agg(v ORDER BY v.version DESC)
        FROM document_versions v WHERE v.document_id = d.id) AS versions
     FROM documents d JOIN sources s ON s.id = d.source_id
     WHERE d.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listClaims(limit: number, offset: number, status?: string) {
  const result = await getPool().query(
    `SELECT c.*, d.title AS document_title, d.canonical_url,
       (SELECT COUNT(*)::integer FROM evidence e WHERE e.claim_id = c.id) AS evidence_count
     FROM claims c JOIN documents d ON d.id = c.document_id
     WHERE ($3::text IS NULL OR c.status = $3)
     ORDER BY c.extracted_at DESC
     LIMIT $1 OFFSET $2`,
    [Math.min(Math.max(limit, 1), 200), Math.max(offset, 0), status ?? null],
  );
  return result.rows;
}

export async function getClaim(id: string) {
  const result = await getPool().query(
    `SELECT c.*, d.title AS document_title, d.normalized_text AS document_text,
       (SELECT jsonb_agg(e ORDER BY e.created_at)
        FROM evidence e WHERE e.claim_id = c.id) AS evidence,
       (SELECT jsonb_agg(v ORDER BY v.created_at DESC)
        FROM claim_verifications v WHERE v.claim_id = c.id) AS verification_history,
       (SELECT jsonb_agg(e2 ORDER BY e2.canonical_name)
        FROM claim_entities ce JOIN entities e2 ON e2.id = ce.entity_id
        WHERE ce.claim_id = c.id) AS entities
     FROM claims c JOIN documents d ON d.id = c.document_id
     WHERE c.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listEvents(limit: number, offset: number, eventType?: string) {
  const result = await getPool().query(
    `SELECT e.*,
       (SELECT COUNT(*)::integer FROM event_claims ec WHERE ec.event_id = e.id) AS claim_count
     FROM events e
     WHERE ($3::text IS NULL OR e.event_type = $3)
     ORDER BY e.occurred_at DESC NULLS LAST, e.created_at DESC
     LIMIT $1 OFFSET $2`,
    [Math.min(Math.max(limit, 1), 200), Math.max(offset, 0), eventType ?? null],
  );
  return result.rows;
}

export async function listFetchRuns(sourceId: string, limit: number) {
  const result = await getPool().query(
    `SELECT * FROM source_fetch_runs WHERE source_id = $1
     ORDER BY started_at DESC LIMIT $2`,
    [sourceId, Math.min(Math.max(limit, 1), 200)],
  );
  return result.rows;
}

export async function reviewClaim(claimId: string, userId: string, status: string, note: string) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const verification = await client.query(
      `INSERT INTO claim_verifications (
         claim_id, status, reasoning, model, reviewed_by, reviewed_at
       )
       SELECT c.id, $2, $3, 'human-review-v1', $4, now()
       FROM claims c WHERE c.id = $1
       RETURNING *`,
      [claimId, status, note, userId],
    );
    if (!verification.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query(`UPDATE claims SET status = $2 WHERE id = $1`, [claimId, status]);
    await client.query(
      `INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'claim.reviewed', 'claim', $2, $3::jsonb)`,
      [userId, claimId, JSON.stringify({ status, note })],
    );
    await client.query("COMMIT");
    return verification.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
