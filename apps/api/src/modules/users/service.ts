import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../../repositories/user.repository';
import type { UserRow } from '../../repositories/user.repository';
import { UnauthorizedError, ValidationError } from '../../errors/appError';
import { getEnv } from '../../config/env';
import type { Env } from '../../config/env';

let cachedRepo: UserRepository | null = null;
let cachedEnv: Env | null = null;

function _getRepo(): UserRepository {
  if (cachedRepo) return cachedRepo;
  cachedRepo = new UserRepository();
  return cachedRepo;
}

function _getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = getEnv();
  return cachedEnv;
}

export interface AuthResult {
  user: Omit<UserRow, 'password_hash'>;
  token: string;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const repo = _getRepo();
  const user = await repo.findByEmail(email);
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password_hash ?? '');
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  const cfg = _getEnv();
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    cfg.JWT_SECRET,
    { expiresIn: cfg.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

  const { password_hash: _passwordHash, ...safeUser } = user;
  return { user: safeUser, token };
}

export async function register(email: string, password: string, name?: string, role = 'viewer'): Promise<Omit<UserRow, 'password_hash'>> {
  const repo = _getRepo();
  const existing = await repo.findByEmail(email);
  if (existing) throw new ValidationError('Email already registered');

  const hashed = await hashPassword(password);
  const user = await repo.create({ email, password_hash: hashed, name, role });
  return user;
}

export async function getUserById(id: string): Promise<Omit<UserRow, 'password_hash'> | null> {
  const repo = _getRepo();
  const user = await repo.findById(id);
  if (!user) return null;
  return user;
}

export async function listUsers(limit = 50, offset = 0) {
  const repo = _getRepo();
  return repo.findAll(limit, offset);
}

export async function updateProfile(id: string, input: { name: string }): Promise<Omit<UserRow, 'password_hash'> | null> {
  const repo = _getRepo();
  return repo.update(id, { name: input.name });
}

export async function changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
  const repo = _getRepo();
  const user = await repo.findById(id);
  if (!user) throw new UnauthorizedError('Invalid credentials');

  // findById omits the hash, so load the full row by email to verify the current password.
  const full = await repo.findByEmail(user.email);
  const valid = await bcrypt.compare(currentPassword, full?.password_hash ?? '');
  // 400 (not 401) so the web client doesn't treat a typo as an expired session.
  if (!valid) throw new ValidationError('Current password is incorrect');
  if (currentPassword === newPassword) throw new ValidationError('New password must be different from the current password');

  await repo.updatePasswordHash(id, await hashPassword(newPassword));
}
