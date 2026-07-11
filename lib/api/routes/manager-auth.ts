import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { getServerEnv } from '@/lib/env';
import { hashPassword, verifyPassword } from '@/lib/password';
import { MANAGER_COOKIE, issueManagerCookie, cookieOptions } from '@/lib/auth';
import { createResetToken, verifyResetToken, consumeResetToken } from '@/lib/reset-token';
import { sendEmail, passwordResetEmail } from '@/lib/email';
import { sendData, sendError } from '../envelope';
import { managerGuard, type AppEnv } from '../guards';

export const managerAuthRoutes = new Hono<AppEnv>();

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/manager/login
managerAuthRoutes.post('/login', zValidator('json', LoginBody), async (c) => {
  const env = getServerEnv();
  const { email, password } = c.req.valid('json');

  const manager = await prisma.storeManager.findFirst({
    where: { email: email.toLowerCase().trim(), isActive: true },
  });
  if (!manager) return sendError(c, 'unauthorized', 'Invalid email or password', 401);

  const ok = await verifyPassword(password, manager.passwordHash);
  if (!ok) return sendError(c, 'unauthorized', 'Invalid email or password', 401);

  // Manager's store must be approved + active.
  const store = await prisma.store.findUnique({
    where: { id: manager.storeId },
    select: { isActive: true, registrationStatus: true },
  });
  if (!store || !store.isActive || store.registrationStatus !== 'APPROVED') {
    return sendError(c, 'forbidden', 'This store is not active yet.', 403);
  }

  const token = await issueManagerCookie(manager.id, manager.storeId, {
    secret: env.MANAGER_SECRET,
    ttlSeconds: env.COOKIE_TTL_SECONDS,
  });
  setCookie(c, MANAGER_COOKIE, token, cookieOptions(env.COOKIE_TTL_SECONDS, env.NODE_ENV === 'production'));

  return sendData(c, { id: manager.id, name: manager.name, email: manager.email, storeId: manager.storeId });
});

// POST /api/manager/logout
managerAuthRoutes.post('/logout', (c) => {
  deleteCookie(c, MANAGER_COOKIE, { path: '/' });
  return sendData(c, { ok: true });
});

// GET /api/manager/me — works for owner (via storeGuard fallback) or manager
managerAuthRoutes.get('/me', managerGuard, async (c) => {
  if (c.get('isOwner')) {
    const store = await prisma.store.findUnique({
      where: { id: c.get('storeId') },
      select: { id: true, name: true },
    });
    return sendData(c, { role: 'owner', storeId: c.get('storeId'), storeName: store?.name ?? null });
  }
  const manager = await prisma.storeManager.findUnique({
    where: { id: c.get('managerId') },
    select: { id: true, name: true, email: true, storeId: true },
  });
  if (!manager) return sendError(c, 'not_found', 'Manager not found', 404);
  return sendData(c, { role: 'manager', ...manager });
});

// ── Forgot / Reset password (store manager) ───────────────────────────────────

const ForgotBody = z.object({ email: z.string().email() });

// POST /api/manager/forgot-password — always 200 (anti-enumeration)
managerAuthRoutes.post('/forgot-password', zValidator('json', ForgotBody), async (c) => {
  const env = getServerEnv();
  const email = c.req.valid('json').email.toLowerCase().trim();
  const manager = await prisma.storeManager.findFirst({
    where: { email, isActive: true },
    select: { storeId: true },
  });
  if (manager) {
    const token = await createResetToken(email, 'STORE_MANAGER', manager.storeId);
    const url = `${env.NEXT_PUBLIC_APP_URL}/store/manager/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail(url);
    void sendEmail({ to: email, subject, html });
  }
  return sendData(c, { ok: true });
});

const ResetBody = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

// POST /api/manager/reset-password
managerAuthRoutes.post('/reset-password', zValidator('json', ResetBody), async (c) => {
  const { token, password } = c.req.valid('json');
  const row = await verifyResetToken(token, 'STORE_MANAGER');
  if (!row) return sendError(c, 'bad_request', 'Invalid or expired reset link.', 400);

  // Resolve the manager by the token's email (re-lookup to get the id).
  const manager = await prisma.storeManager.findFirst({ where: { email: row.email } });
  if (!manager) return sendError(c, 'bad_request', 'Invalid or expired reset link.', 400);

  const hash = await hashPassword(password);
  await prisma.storeManager.update({ where: { id: manager.id }, data: { passwordHash: hash } });
  await consumeResetToken(row.id);
  return sendData(c, { ok: true });
});
