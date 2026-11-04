import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError, ValidationError, UnauthorizedError, ForbiddenError } from '../../src/errors/appError';

describe('AppError', () => {
  it('sets correct properties', () => {
    const err = new AppError(500, 'internal_error', 'boom');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('internal_error');
    expect(err.message).toBe('boom');
    expect(err.isOperational).toBe(true);
  });

  it('is instanceof Error', () => {
    const err = new AppError(500, 'err', 'msg');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('NotFoundError', () => {
  it('defaults to 404', () => {
    const err = new NotFoundError('User');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('not_found');
  });
});

describe('ValidationError', () => {
  it('includes details', () => {
    const err = new ValidationError('Bad input', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ field: 'email' });
  });
});

describe('UnauthorizedError / ForbiddenError', () => {
  it('sets correct status codes', () => {
    const unauth = new UnauthorizedError();
    expect(unauth.statusCode).toBe(401);

    const forb = new ForbiddenError();
    expect(forb.statusCode).toBe(403);
  });
});
