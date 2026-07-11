/**
 * Auth cookies — Jewel Factory (3 roles: manufacturer, store owner, manager).
 *
 * EDGE-SAFE: uses Web Crypto SubtleCrypto (HMAC-SHA256), never node:crypto, so
 * it works in both the Node runtime and Next.js middleware (Edge). Password
 * hashing (bcrypt) is Node-only and lives in lib/password.ts — do NOT import
 * that from middleware.
 *
 * Cookie format (all roles):  <part1>.<part2>...<issuedAtMs>.<sigBase64Url>
 *   sig = HMAC-SHA256(secret, "<all parts except sig joined by '.'>")
 *
 * Each role uses its OWN secret, so a token signed for one role can't be
 * replayed as another.
 */

// ── Cookie names ──────────────────────────────────────────────────────────────

export const MANUFACTURER_COOKIE = 'jf_manufacturer';
export const STORE_COOKIE = 'jf_store';
export const MANAGER_COOKIE = 'jf_manager';

// ── Cookie option shape (for hono/next setCookie) ─────────────────────────────

export type CookieOptions = {
  httpOnly: true;
  sameSite: 'strict';
  secure: boolean;
  path: string;
  maxAge: number;
};

export function cookieOptions(ttlSeconds: number, secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    maxAge: ttlSeconds,
  };
}

// ── HMAC primitives (Web Crypto) ──────────────────────────────────────────────

const hmacKeyCache = new Map<string, CryptoKey>();

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function b64urlToBytes(s: string): Uint8Array {
  const padded = s.replaceAll('-', '+').replaceAll('_', '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const bin = atob(padded + '='.repeat(padLen));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const cached = hmacKeyCache.get(secret);
  if (cached) return cached;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  hmacKeyCache.set(secret, key);
  return key;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64urlFromBytes(new Uint8Array(sig));
}

async function verifySig(secret: string, payload: string, sig: string): Promise<boolean> {
  const key = await importHmacKey(secret);
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return timingSafeEqualBytes(new Uint8Array(expected), b64urlToBytes(sig));
}

// ── Generic token issue/verify over a list of string parts ────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function issueToken(secret: string, parts: string[], ttlSeconds: number): Promise<string> {
  void ttlSeconds; // ttl is enforced at verify time via issuedAt
  const issuedAt = Date.now().toString();
  const body = [...parts, issuedAt].join('.');
  const sig = await sign(secret, body);
  return `${body}.${sig}`;
}

/** Returns the payload parts (without issuedAt/sig) if valid, else null. */
async function verifyToken(
  token: string | undefined,
  secret: string,
  ttlSeconds: number,
  expectedParts: number,
): Promise<string[] | null> {
  if (!token) return null;
  const segments = token.split('.');
  // expectedParts payload segments + issuedAt + sig
  if (segments.length !== expectedParts + 2) return null;
  const sig = segments[segments.length - 1]!;
  const issuedAtStr = segments[segments.length - 2]!;
  const payloadParts = segments.slice(0, expectedParts);
  const body = segments.slice(0, segments.length - 1).join('.');

  const ok = await verifySig(secret, body, sig);
  if (!ok) return null;

  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > ttlSeconds * 1000) return null;

  return payloadParts;
}

// ── Manufacturer cookie: <manufacturerId> ─────────────────────────────────────

export async function issueManufacturerCookie(
  manufacturerId: string,
  opts: { secret: string; ttlSeconds: number },
): Promise<string> {
  return issueToken(opts.secret, [manufacturerId], opts.ttlSeconds);
}

export async function verifyManufacturerCookie(
  token: string | undefined,
  opts: { secret: string; ttlSeconds: number },
): Promise<{ valid: true; manufacturerId: string } | { valid: false }> {
  const parts = await verifyToken(token, opts.secret, opts.ttlSeconds, 1);
  if (!parts || !UUID_RE.test(parts[0]!)) return { valid: false };
  return { valid: true, manufacturerId: parts[0]! };
}

// ── Store cookie: <storeId> ───────────────────────────────────────────────────

export async function issueStoreCookie(
  storeId: string,
  opts: { secret: string; ttlSeconds: number },
): Promise<string> {
  return issueToken(opts.secret, [storeId], opts.ttlSeconds);
}

export async function verifyStoreCookie(
  token: string | undefined,
  opts: { secret: string; ttlSeconds: number },
): Promise<{ valid: true; storeId: string } | { valid: false }> {
  const parts = await verifyToken(token, opts.secret, opts.ttlSeconds, 1);
  if (!parts || !UUID_RE.test(parts[0]!)) return { valid: false };
  return { valid: true, storeId: parts[0]! };
}

// ── Manager cookie: <managerId>.<storeId> ─────────────────────────────────────

export async function issueManagerCookie(
  managerId: string,
  storeId: string,
  opts: { secret: string; ttlSeconds: number },
): Promise<string> {
  return issueToken(opts.secret, [managerId, storeId], opts.ttlSeconds);
}

export async function verifyManagerCookie(
  token: string | undefined,
  opts: { secret: string; ttlSeconds: number },
): Promise<{ valid: true; managerId: string; storeId: string } | { valid: false }> {
  const parts = await verifyToken(token, opts.secret, opts.ttlSeconds, 2);
  if (!parts || !UUID_RE.test(parts[0]!) || !UUID_RE.test(parts[1]!)) return { valid: false };
  return { valid: true, managerId: parts[0]!, storeId: parts[1]! };
}
