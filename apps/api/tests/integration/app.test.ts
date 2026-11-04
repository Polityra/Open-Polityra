import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /health', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost:5432/test');
    vi.stubEnv('JWT_SECRET', 'test_secret_at_least_32_characters_long!!');
    app = createApp();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost:5432/test');
    vi.stubEnv('JWT_SECRET', 'test_secret_at_least_32_characters_long!!');
    app = createApp();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('not_found');
  });
});

describe('Fiscal balance research API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost:5432/test');
    vi.stubEnv('JWT_SECRET', 'test_secret_at_least_32_characters_long!!');
    app = createApp();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('serves the attributed annual snapshot without querying the database', async () => {
    const res = await request(app).get('/api/v1/research/fiscal-balance/data');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.source.dataset_id).toBe('gov_10dd_edpt1');
    expect(res.body.data.observations).toHaveLength(26);
    expect(res.body.data.observations.at(-1)).toMatchObject({ year: 2025, balance_pct_gdp: -3.8, debt_pct_gdp: 88.4 });
  });

  it('returns reproducible baseline, stress, and improvement scenarios', async () => {
    const res = await request(app)
      .post('/api/v1/research/fiscal-balance/analyze')
      .send({ projectionYears: 2, stressAnnualBalanceChange: -0.5, stressNominalGdpGrowth: 1, stressEffectiveInterest: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.is_forecast).toBe(false);
    expect(res.body.data.projection.scenarios.map((scenario: { id: string }) => scenario.id)).toEqual([
      'baseline',
      'stress',
      'improvement',
    ]);
    expect(res.body.data.projection.scenarios[0].values[0]).toMatchObject({
      year: 2026,
      balance_pct_gdp: -3.8,
      debt_pct_gdp: 92.2,
    });
    expect(res.body.data.projection.scenarios[1].values).toHaveLength(2);
    expect(res.body.data.limitations.length).toBeGreaterThan(0);
  });

  it('rejects scenario values outside documented bounds', async () => {
    const res = await request(app)
      .post('/api/v1/research/fiscal-balance/analyze')
      .send({ projectionYears: 11 });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('validation_error');
  });
});
