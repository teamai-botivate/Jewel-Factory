import { prisma } from '@/lib/prisma';

/**
 * Generate the next global design number: JF-0001, JF-0002, ...
 *
 * Uses a Postgres sequence (created lazily) so concurrent creates never collide.
 * The sequence is the single source of truth; we don't derive from COUNT(*),
 * which would reuse numbers after deletes.
 */
export async function nextDesignNumber(): Promise<string> {
  // Create the sequence once (no-op if it already exists).
  await prisma.$executeRawUnsafe(
    `CREATE SEQUENCE IF NOT EXISTS design_number_seq START 1`,
  );
  const rows = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
    `SELECT nextval('design_number_seq') AS nextval`,
  );
  const n = Number(rows[0]?.nextval ?? 1);
  return `JF-${String(n).padStart(4, '0')}`;
}
