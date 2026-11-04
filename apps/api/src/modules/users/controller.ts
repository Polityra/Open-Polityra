import type { Request, Response } from 'express';
import * as userService from './service';
import { changePasswordSchema, loginUserSchema, registerUserSchema, updateProfileSchema } from './schema';

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: { code: 'validation_error', message: parsed.error.message }, meta: { timestamp: new Date().toISOString() } });
    return;
  }

  const result = await userService.login(parsed.data.email, parsed.data.password);
  res.json({ ok: true, data: { user: result.user, token: result.token }, meta: { requestId: req.id ?? '', timestamp: new Date().toISOString() } });
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: { code: 'validation_error', message: parsed.error.message }, meta: { timestamp: new Date().toISOString() } });
    return;
  }

  const result = await userService.register(parsed.data.email, parsed.data.password, parsed.data.name, parsed.data.role);
  res.status(201).json({ ok: true, data: { user: result }, meta: { requestId: req.id ?? '', timestamp: new Date().toISOString() } });
}

export async function getUser(req: Request<{ id: string }>, res: Response): Promise<void> {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ ok: false, error: { code: 'not_found', message: 'User not found' }, meta: { timestamp: new Date().toISOString() } });
    return;
  }
  res.json({ ok: true, data: { user }, meta: { requestId: req.id ?? '', timestamp: new Date().toISOString() } });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const result = await userService.listUsers();
  res.json({ ok: true, data: { users: result.rows, meta: { total: result.total, limit: 50, offset: 0 } }, meta: { requestId: req.id ?? '', timestamp: new Date().toISOString() } });
}

/** Id of the authenticated user. Adjust to match what your auth middleware puts on `req`. */
function currentUserId(req: Request): string | undefined {
  const u = (req as unknown as { user?: { id?: string; sub?: string } }).user;
  return u?.id ?? u?.sub;
}

function unauthorized(res: Response): void {
  res.status(401).json({ ok: false, error: { code: 'unauthorized', message: 'Authentication required' }, meta: { timestamp: new Date().toISOString() } });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const id = currentUserId(req);
  if (!id) return unauthorized(res);

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: { code: 'validation_error', message: parsed.error.message }, meta: { timestamp: new Date().toISOString() } });
    return;
  }

  const user = await userService.updateProfile(id, parsed.data);
  if (!user) {
    res.status(404).json({ ok: false, error: { code: 'not_found', message: 'User not found' }, meta: { timestamp: new Date().toISOString() } });
    return;
  }
  res.json({ ok: true, data: { user }, meta: { requestId: req.id ?? '', timestamp: new Date().toISOString() } });
}

export async function changeMyPassword(req: Request, res: Response): Promise<void> {
  const id = currentUserId(req);
  if (!id) return unauthorized(res);

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: { code: 'validation_error', message: parsed.error.message }, meta: { timestamp: new Date().toISOString() } });
    return;
  }

  await userService.changePassword(id, parsed.data.currentPassword, parsed.data.newPassword);
  res.json({ ok: true, data: { message: 'Password updated' }, meta: { requestId: req.id ?? '', timestamp: new Date().toISOString() } });
}
