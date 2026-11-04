import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /health', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret_at_least_32_characters_long!!';
    app = createApp();
  });

  afterEach(async () => {
    // Clear module caches
    for (const key of Object.keys(require.cache)) {
      if (key.includes('apps/api')) delete require.cache[key];
    }
  });

  it('returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });
});

describe('GET /api/v1/nonexistent', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret_at_least_32_characters_long!!';
    app = createApp();
  });

  afterEach(async () => {
    for (const key of Object.keys(require.cache)) {
      if (key.includes('apps/api')) delete require.cache[key];
    }
  });

  it('returns 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('not_found');
  });
});
