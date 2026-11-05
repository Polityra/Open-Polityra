import { getPool } from '../../config/database';

export class NewsSchemaMissingError extends Error {
  constructor() {
    super('News storage is not initialized. Run: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/migrations/004_news_items.sql');
    this.name = 'NewsSchemaMissingError';
  }
}

export async function assertNewsSchema(): Promise<void> {
  const result = await getPool().query<{ available: boolean }>(
    `SELECT to_regclass('news_items') IS NOT NULL AS available`,
  );
  if (!result.rows[0]?.available) throw new NewsSchemaMissingError();
}

export type NewsTopic = 'geopolitics' | 'conflict' | 'security' | 'cybersecurity' | 'terrorism' | 'sanctions';

export interface NewsItem {
  id: string;
  source_id: string;
  source_name: string;
  publisher: string | null;
  category: string;
  title: string;
  summary: string | null;
  url: string;
  published_at: Date | null;
  topics: NewsTopic[];
  fetched_at: Date;
}

export interface IngestedNewsItem {
  externalId: string;
  title: string;
  summary: string | null;
  url: string;
  publishedAt: Date | null;
}

export async function listNews(params: {
  limit: number;
  offset: number;
  category?: string;
  topic?: NewsTopic;
  search?: string;
}) {
  const pool = getPool();
  const predicates: string[] = [];
  const values: unknown[] = [];
  let parameter = 1;

  if (params.category) {
    predicates.push(`s.category = $${parameter++}`);
    values.push(params.category);
  }
  if (params.topic) {
    predicates.push(`$${parameter++} = ANY(n.topics)`);
    values.push(params.topic);
  }
  if (params.search) {
    predicates.push(`(n.title ILIKE $${parameter} OR n.summary ILIKE $${parameter})`);
    values.push(`%${params.search}%`);
    parameter += 1;
  }

  const where = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  const count = await pool.query(
    `SELECT COUNT(*) FROM news_items n JOIN sources s ON s.id = n.source_id ${where}`,
    values,
  );
  const rows = await pool.query(
    `SELECT n.id, n.source_id, s.name AS source_name, s.publisher, s.category, n.title, n.summary, n.url, n.published_at, n.topics, n.fetched_at
     FROM news_items n JOIN sources s ON s.id = n.source_id ${where}
     ORDER BY n.published_at DESC NULLS LAST, n.fetched_at DESC
     LIMIT $${parameter} OFFSET $${parameter + 1}`,
    [...values, params.limit, params.offset],
  );
  return { rows: rows.rows as NewsItem[], total: Number(count.rows[0].count) };
}

export async function storeNewsItems(sourceId: string, topics: NewsTopic[], items: IngestedNewsItem[]) {
  if (items.length === 0) return 0;
  const pool = getPool();
  const client = await pool.connect();
  let inserted = 0;
  try {
    await client.query('BEGIN');
    for (const item of items) {
      const result = await client.query(
        `INSERT INTO news_items (source_id, external_id, title, summary, url, published_at, topics)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (source_id, external_id) DO NOTHING`,
        [sourceId, item.externalId, item.title, item.summary, item.url, item.publishedAt, topics],
      );
      inserted += result.rowCount ?? 0;
    }
    await client.query('COMMIT');
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function pruneExpiredNewsItems(): Promise<number> {
  const result = await getPool().query(
    `DELETE FROM news_items WHERE fetched_at < now() - INTERVAL '90 days'`,
  );
  return result.rowCount ?? 0;
}
