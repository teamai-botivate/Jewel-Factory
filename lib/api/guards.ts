import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';

import { getServerEnv } from '@/lib/env';
import {
  MANUFACTURER_COOKIE,
  STORE_COOKIE,
  BRANCH_MANAGER_COOKIE,
  verifyManufacturerCookie,
  verifyStoreCookie,
  verifyBranchManagerCookie,
} from '@/lib/auth';
import { sendError } from './envelope';

/**
 * Context variables set by the guards. Handlers read these — NEVER the request
 * body — to know who the caller is and which tenant they belong to.
 */
export type AppVariables = {
  manufacturerId: string;
  storeId: string; // for a branch manager, this is the RETAILER id (tenant)
  managerId: string; // for owner, this equals storeId (owner acts as itself)
  isOwner: boolean;
  branchId: string; // set by branchManagerGuard
  branchManagerId: string; // set by branchManagerGuard
};

/** Branch-manager secret, falling back to MANAGER_SECRET when unset. */
function branchManagerSecret(env: { BRANCH_MANAGER_SECRET?: string; MANAGER_SECRET: string }): string {
  return env.BRANCH_MANAGER_SECRET ?? env.MANAGER_SECRET;
}

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

// ── managerGuard: Retailer/owner only (approvals, dashboards, order ops) ───────
// The HO Manager role was removed — the Retailer (jf_store) does all of this now.
// Kept as a named guard so the many /store-ops routes don't need touching.
export const managerGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  const env = getServerEnv();
  const ownerResult = await verifyStoreCookie(getCookie(c, STORE_COOKIE), {
    secret: env.STORE_SECRET,
    ttlSeconds: env.COOKIE_TTL_SECONDS,
  });
  if (!ownerResult.valid) return sendError(c, 'unauthorized', 'Retailer login required', 401);
  c.set('storeId', ownerResult.storeId);
  c.set('managerId', ownerResult.storeId); // owner acts as itself
  c.set('isOwner', true);
  await next();
};

// ── branchManagerGuard: Store Manager (per branch) ────────────────────────────
// Sets branchId + branchManagerId, and storeId = retailerId so existing
// tenant-scoped DB helpers (which take the retailer/store id) work unchanged.
export const branchManagerGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  const env = getServerEnv();
  const result = await verifyBranchManagerCookie(getCookie(c, BRANCH_MANAGER_COOKIE), {
    secret: branchManagerSecret(env),
    ttlSeconds: env.COOKIE_TTL_SECONDS,
  });
  if (!result.valid) return sendError(c, 'unauthorized', 'Store manager login required', 401);
  c.set('branchManagerId', result.branchManagerId);
  c.set('branchId', result.branchId);
  c.set('storeId', result.retailerId); // retailer = tenant
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
