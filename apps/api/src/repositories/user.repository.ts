import { Pool } from 'pg';
import { getPool } from '../config/database';

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UserRecord extends UserRow {
  password_hash: string;
}

export class UserRepository {
  private pool: Pool;
  updatePasswordHash: any;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  async findById(id: string): Promise<UserRow | null> {
    const result = await this.pool.query(
      'SELECT id, email, display_name AS name, role, is_active, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.pool.query(
      'SELECT id, email, password_hash, display_name AS name, role, is_active, created_at, updated_at FROM users WHERE email = $1 LIMIT 1',
      [email],
    );
    return result.rows[0] ?? null;
  }

  async findAll(limit = 50, offset = 0): Promise<{ rows: UserRow[]; total: number }> {
    const countResult = await this.pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await this.pool.query(
      'SELECT id, email, display_name AS name, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return { rows: result.rows, total };
  }

  async create(params: { email: string; password_hash: string; name?: string; role?: string }): Promise<UserRow> {
    const result = await this.pool.query(
      `INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name AS name, role, is_active, created_at, updated_at`,
      [params.email, params.password_hash, params.name ?? null, params.role ?? 'viewer'],
    );
    return result.rows[0] as UserRow;
  }

  async update(id: string, updates: Partial<Pick<UserRow, 'name' | 'role' | 'is_active'>>): Promise<UserRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.name !== undefined) { fields.push(`display_name = $${idx++}`); values.push(updates.name); }
    if (updates.role !== undefined) { fields.push(`role = $${idx++}`); values.push(updates.role); }
    if (updates.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(updates.is_active); }

    if (fields.length === 0) return null;

    fields.push('updated_at = NOW()');
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, display_name AS name, role, is_active, created_at, updated_at`;
    values.push(id);

    const result = await this.pool.query(sql, values);
    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
