import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/appError';
import { getEnv } from '../config/env';
import type { Env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

const REQUIRED_ROLES: Record<string, string[]> = {
  '/api/v1/users': ['admin'],
};

function _hasRole(reqPath: string, role: string): boolean {
  const required = REQUIRED_ROLES[reqPath];
  if (!required) return true;
  return required.includes(role);
}

export function authMiddleware(env?: Env) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    const cfg = env ?? getEnv();
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, cfg.JWT_SECRET) as { sub: string; role: string };
      req.userId = payload.sub;
      req.userRole = payload.role;

      if (!_hasRole(req.path, req.userRole ?? '')) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid or expired token');
      }
      throw err;
    }
  };
}
