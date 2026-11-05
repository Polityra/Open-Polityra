import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { getEnv } from '../config/env';
import type { Env } from '../config/env';

export function rateLimiter(env?: Env): RequestHandler {
  const createLimiter = (cfg: Env): RequestHandler =>
    rateLimit({
      windowMs: cfg.RATE_LIMIT_WINDOW_MS,
      max: cfg.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          ok: false,
          error: {
            code: 'rate_limit_exceeded',
            message: 'Too many requests. Please try again later.',
          },
          meta: { timestamp: new Date().toISOString() },
        });
      },
    });

  if (env) return createLimiter(env);

  let limiter: RequestHandler | undefined;

  const lazyLimiter: RequestHandler = (req, res, next) => {
    limiter ??= createLimiter(getEnv());
    return limiter(req, res, next);
  };

  return lazyLimiter;
}