import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { UserRepository } from '../../../src/repositories/user.repository';

function createRepository() {
  const query = vi.fn().mockResolvedValue({ rows: [] });
  const repo = new UserRepository({ query } as unknown as Pool);
  return { query, repo };
}

describe('UserRepository', () => {
  it('looks up email using the database display_name column', async () => {
    const { query, repo } = createRepository();

    await repo.findByEmail('person@example.com');

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('display_name AS name'),
      ['person@example.com'],
    );
  });

  it('creates users using the database display_name column', async () => {
    const { query, repo } = createRepository();

    await repo.create({
      email: 'person@example.com',
      password_hash: 'hashed-password',
      name: 'Person',
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users (email, password_hash, display_name, role)'),
      ['person@example.com', 'hashed-password', 'Person', 'viewer'],
    );
  });

  it('updates names using the database display_name column', async () => {
    const { query, repo } = createRepository();

    await repo.update('user-id', { name: 'Updated name' });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('display_name = $1'),
      ['Updated name', 'user-id'],
    );
  });
});
