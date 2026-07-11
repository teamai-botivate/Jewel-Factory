import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';

import { getServerEnv } from '@/lib/env';
import {
  MANUFACTURER_COOKIE,
  STORE_COOKIE,
  MANAGER_COOKIE,
  verifyManufacturerCookie,
  verifyStoreCookie,
  verifyManagerCookie,
} from '@/lib/auth';
import { sendError } from './envelope';

/**
 * Context variables set by the guards. Handlers read these — NEVER the request
 * body — to know who the caller is and which tenant they belong to.
 */
export type AppVariables = {
  manufacturerId: string;
  storeId: string;
  managerId: string; // for owner, this equals storeId (owner acts as itself)
  isOwner: boolean;
};

export type AppEnv = { Variables: AppVariables };

// ── manufacturerGuard: all /api/manufacturer/* (except login/logout) ──────────
export const manufacturerGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  const env = getServerEnv();
  const result = await verifyManufacturerCookie(getCookie(c, MANUFACTURER_COOKIE), {
    secret: env.MANUFACTURER_SECRET,
    ttlSeconds: env.COOKIE_TTL_SECONDS,
  });
  if (!result.valid) return sendError(c, 'unauthorized', 'Manufacturer login required', 401);
  c.set('manufacturerId', result.manufacturerId);
  await next();
};

// ── storeGuard: owner-only routes (settings, manager management, place B2B) ───
export const storeGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  const env = getServerEnv();
  const result = await verifyStoreCookie(getCookie(c, STORE_COOKIE), {
    secret: env.STORE_SECRET,
    ttlSeconds: env.COOKIE_TTL_SECONDS,
  });
  if (!result.valid) return sendError(c, 'unauthorized', 'Store owner login required', 401);
  c.set('storeId', result.storeId);
  c.set('managerId', result.storeId);
  c.set('isOwner', true);
  await next();
};

// ── managerGuard: owner OR manager (order/custom-design approvals, dashboards) ─
// Owner (jf_store) can do anything a manager can. Sets isOwner accordingly.
export const managerGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  const env = getServerEnv();

  // Owner first
  const ownerResult = await verifyStoreCookie(getCookie(c, STORE_COOKIE), {
    secret: env.STORE_SECRET,
    ttlSeconds: env.COOKIE_TTL_SECONDS,
  });
  if (ownerResult.valid) {
    c.set('storeId', ownerResult.storeId);
    c.set('managerId', ownerResult.storeId); // owner acts as itself
    c.set('isOwner', true);
    await next();
    return;
  }

  // Manager
  const mgrResult = await verifyManagerCookie(getCookie(c, MANAGER_COOKIE), {
    secret: env.MANAGER_SECRET,
    ttlSeconds: env.COOKIE_TTL_SECONDS,
  });
  if (!mgrResult.valid) return sendError(c, 'unauthorized', 'Manager or store login required', 401);
  c.set('storeId', mgrResult.storeId);
  c.set('managerId', mgrResult.managerId);
  c.set('isOwner', false);
  await next();
};

/**
 * Resolve the reviewer/approver id for FK columns that reference store_managers.
 * Owner -> null (owner-approved), manager -> real managerId.
 * (This was the source of a duplicate-order bug in the old app.)
 */
export function approverIdOrNull(c: { get: (k: 'managerId' | 'isOwner') => string | boolean }): string | null {
  return c.get('isOwner') ? null : (c.get('managerId') as string);
}
