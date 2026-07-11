import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import {
  updateStoreBranding,
  updateStoreProfile,
  listManagers,
  createManager,
  updateManager,
  resetManagerPassword,
  deleteManager,
} from '@/lib/db/stores';
import { signUpload, storeFolder } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { sendData, sendError } from '../envelope';
import { storeGuard, type AppEnv } from '../guards';

const emptyToUndef = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

// All store-portal routes are OWNER-only (storeGuard). Manager operations that
// managers can also do (approvals) live in the manager routes module.
export const storePortalRoutes = new Hono<AppEnv>();
storePortalRoutes.use('*', storeGuard);

// ── Branding ──────────────────────────────────────────────────────────────────

const BrandingBody = z.object({
  logoUrl: z.preprocess(emptyToUndef, z.string().url().nullish()),
  tagline: z.preprocess(emptyToUndef, z.string().nullish()),
  websiteUrl: z.preprocess(emptyToUndef, z.string().url().nullish()),
});

storePortalRoutes.patch('/branding', zValidator('json', BrandingBody), async (c) => {
  const b = c.req.valid('json');
  const result = await updateStoreBranding(c.get('storeId'), {
    logoUrl: (b.logoUrl ?? null) as string | null,
    tagline: (b.tagline ?? null) as string | null,
    websiteUrl: (b.websiteUrl ?? null) as string | null,
  });
  return sendData(c, result);
});

// POST /branding/logo/sign — signed Cloudinary upload for store logo
storePortalRoutes.post('/branding/logo/sign', async (c) => {
  try {
    const signed = signUpload({ folder: storeFolder(c.get('storeId'), 'logo'), bucket: 'logo' });
    return sendData(c, signed);
  } catch (err) {
    return sendError(c, 'upstream_failed', err instanceof Error ? err.message : 'Cloudinary not configured', 503);
  }
});

// ── Kiosk PIN (device unlock) ─────────────────────────────────────────────────

// GET /kiosk-pin — is a kiosk PIN currently set? (never returns the PIN itself)
storePortalRoutes.get('/kiosk-pin', async (c) => {
  const store = await prisma.store.findUnique({
    where: { id: c.get('storeId') },
    select: { kioskPinHash: true },
  });
  return sendData(c, { isSet: !!store?.kioskPinHash });
});

// PUT /kiosk-pin — set/replace the kiosk PIN (min 4 chars/digits)
const KioskPinBody = z.object({ pin: z.string().min(4).max(20) });
storePortalRoutes.put('/kiosk-pin', zValidator('json', KioskPinBody), async (c) => {
  const hash = await hashPassword(c.req.valid('json').pin);
  await prisma.store.update({ where: { id: c.get('storeId') }, data: { kioskPinHash: hash } });
  return sendData(c, { ok: true, isSet: true });
});

// DELETE /kiosk-pin — remove the PIN (kiosk becomes open to anyone with the URL)
storePortalRoutes.delete('/kiosk-pin', async (c) => {
  await prisma.store.update({ where: { id: c.get('storeId') }, data: { kioskPinHash: null } });
  return sendData(c, { ok: true, isSet: false });
});

// ── Profile (name, phone, fixed address) ──────────────────────────────────────

const ProfileBody = z.object({
  name: z.string().min(2).optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressPincode: z.string().optional(),
  addressLandmark: z.preprocess(emptyToUndef, z.string().optional()),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
});

storePortalRoutes.patch('/profile', zValidator('json', ProfileBody), async (c) => {
  const result = await updateStoreProfile(c.get('storeId'), c.req.valid('json') as Record<string, string>);
  return sendData(c, result);
});

// ── Managers (owner only) ─────────────────────────────────────────────────────

storePortalRoutes.get('/managers', async (c) => {
  return sendData(c, await listManagers(c.get('storeId')));
});

const CreateManagerBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.preprocess(emptyToUndef, z.string().optional()),
});

storePortalRoutes.post('/managers', zValidator('json', CreateManagerBody), async (c) => {
  const b = c.req.valid('json');
  try {
    const mgr = await createManager(c.get('storeId'), {
      name: b.name, email: b.email, password: b.password, phone: b.phone as string | undefined,
    });
    return sendData(c, mgr, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return sendError(c, 'conflict', 'A manager with this email already exists for your store.', 409);
    }
    return sendError(c, 'internal_error', msg, 500);
  }
});

const UpdateManagerBody = z.object({
  name: z.string().min(2).optional(),
  phone: z.preprocess(emptyToUndef, z.string().optional()),
  isActive: z.boolean().optional(),
});

storePortalRoutes.patch('/managers/:id', zValidator('json', UpdateManagerBody), async (c) => {
  const result = await updateManager(c.get('storeId'), c.req.param('id'), c.req.valid('json') as Record<string, unknown>);
  if (!result) return sendError(c, 'not_found', 'Manager not found', 404);
  return sendData(c, result);
});

const MgrPasswordBody = z.object({ password: z.string().min(6) });

storePortalRoutes.put('/managers/:id/password', zValidator('json', MgrPasswordBody), async (c) => {
  const ok = await resetManagerPassword(c.get('storeId'), c.req.param('id'), c.req.valid('json').password);
  if (!ok) return sendError(c, 'not_found', 'Manager not found', 404);
  return sendData(c, { ok: true });
});

storePortalRoutes.delete('/managers/:id', async (c) => {
  const ok = await deleteManager(c.get('storeId'), c.req.param('id'));
  if (!ok) return sendError(c, 'not_found', 'Manager not found', 404);
  return sendData(c, { ok: true });
});
