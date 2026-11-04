import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as dotenv from 'dotenv';

describe('env schema', () => {
  const originalEnv = { ...process.env };

  function setEnv(): void {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.JWT_SECRET = 'a'.repeat(32);
  }

  beforeEach(() => {
    setEnv();
    // Clear module cache so env.ts reloads fresh
    delete require.cache[require.resolve('../../src/config/env')];
  });

  afterEach(() => {
    Object.keys(originalEnv).forEach((k) => (process.env[k] = originalEnv[k]));
    if (!originalEnv.NODE_ENV) delete process.env.NODE_ENV;
    if (!originalEnv.PORT) delete process.env.PORT;
    if (!originalEnv.DATABASE_URL) delete process.env.DATABASE_URL;
    if (!originalEnv.JWT_SECRET) delete process.env.JWT_SECRET;
  });

  it('validates correct env', async () => {
    const { getEnv } = await import('../../src/config/env');
    expect(() => getEnv()).not.toThrow();
  });

  it('throws on missing JWT_SECRET', async () => {
    delete process.env.JWT_SECRET;
    // Need fresh import for this test
    const mod = await import('../../src/config/env');
    expect(() => mod.getEnv()).toThrow(/JWT_SECRET/);
  });
});
