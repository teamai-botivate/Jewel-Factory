/**
 * Password-reset token helpers. NODE-ONLY (uses node:crypto).
 * We store only the SHA-256 hash of the token; the raw token goes in the email.
 */
import crypto from 'node:crypto';

import { prisma } from '@/lib/prisma';
import type { ResetRole } from '@prisma/client';

const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Create a reset token; invalidates prior unused tokens for the same email+role. */
export async function createResetToken(
  email: string,
  role: ResetRole,
  storeId: string | null,
): Promise<string> {
  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);

  // Invalidate any prior unused tokens for this email+role.
  await prisma.passwordResetToken.updateMany({
    where: { email, role, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      email,
      role,
      storeId,
      tokenHash,
      expiresAt: new Date(Date.now() + EXPIRY_MS),
    },
  });

  return raw;
}

/** Verify a raw token for a role. Returns the token row if valid+unused+unexpired. */
export async function verifyResetToken(token: string, role: ResetRole) {
  const tokenHash = hashToken(token);
  const row = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, role, usedAt: null, expiresAt: { gt: new Date() } },
  });
  return row;
}

export async function consumeResetToken(id: string): Promise<void> {
  await prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
}
