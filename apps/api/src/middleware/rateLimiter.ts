import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getEnv } from '../config/env';
import type { Env } from '../config/env';

const rateLimitEnvSchema = z.object({
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

export function rateLimiter(env?: Env): RequestHandler {
  const cfg = env ?? rateLimitEnvSchema.parse(process.env);
  const limiter = rateLimit({
    windowMs: cfg.RATE_LIMIT_WINDOW_MS,
    max: cfg.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
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

  return (req, res, next) => {
    if (!env) getEnv();
    return limiter(req, res, next);
  };
}
