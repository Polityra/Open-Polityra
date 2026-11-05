import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../../../packages/api-client/src/index';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ApiClient unauthorized responses', () => {
  it('notifies the auth provider when an authenticated request has an invalid token', async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({
        ok: false,
        error: { code: 'unauthorized', message: 'Invalid or expired token' },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )));
    const client = new ApiClient({
      baseUrl: 'http://localhost:4000',
      token: 'expired-token',
      onUnauthorized,
    });

    await expect(client.get('/api/v1/sources')).rejects.toMatchObject({
      code: 'unauthorized',
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not clear a session for a login failure without an auth token', async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({
        ok: false,
        error: { code: 'unauthorized', message: 'Invalid credentials' },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )));
    const client = new ApiClient({ baseUrl: 'http://localhost:4000', onUnauthorized });

    await expect(client.post('/api/v1/auth/login', {})).rejects.toMatchObject({
      code: 'unauthorized',
      status: 401,
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
