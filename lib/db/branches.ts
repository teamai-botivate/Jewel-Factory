/**
 * Branch (= UI "Store") + BranchManager (= UI "Store Manager") data helpers.
 *
 * A Branch belongs to a Retailer (the `stores` table). All functions here are
 * scoped by retailerId (the tenant) so a retailer can only touch its own branches.
 */
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

// ── Branches ──────────────────────────────────────────────────────────────────

export type BranchInput = {
  name: string;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressPincode?: string | null;
  addressLandmark?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

export function listBranches(retailerId: string) {
  return prisma.branch.findMany({
    where: { retailerId },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { managers: true } } },
  });
}

export function getBranch(retailerId: string, branchId: string) {
  return prisma.branch.findFirst({ where: { id: branchId, retailerId } });
}

export const FREE_BRANCH_LIMIT = 2;

export async function createBranch(
  retailerId: string,
  input: BranchInput,
): Promise<{ error: 'limit_reached'; limit: number } | { branch: Awaited<ReturnType<typeof prisma.branch.create>> }> {
  const [store, activeCount] = await Promise.all([
    prisma.store.findUnique({ where: { id: retailerId }, select: { extraBranchAllowance: true } }),
    prisma.branch.count({ where: { retailerId, isActive: true } }),
  ]);
  const limit = FREE_BRANCH_LIMIT + (store?.extraBranchAllowance ?? 0);
  if (activeCount >= limit) return { error: 'limit_reached', limit };

  const branch = await prisma.branch.create({
    data: {
      retailerId,
      name: input.name,
      addressStreet: input.addressStreet ?? null,
      addressCity: input.addressCity ?? null,
      addressState: input.addressState ?? null,
      addressPincode: input.addressPincode ?? null,
      addressLandmark: input.addressLandmark ?? null,
      phone: input.phone ?? null,
      isActive: input.isActive ?? true,
    },
  });
  return { branch };
}

export async function updateBranch(retailerId: string, branchId: string, input: Partial<BranchInput>) {
  const existing = await prisma.branch.findFirst({ where: { id: branchId, retailerId }, select: { id: true } });
  if (!existing) return null;
  return prisma.branch.update({
    where: { id: branchId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.addressStreet !== undefined ? { addressStreet: input.addressStreet } : {}),
      ...(input.addressCity !== undefined ? { addressCity: input.addressCity } : {}),
      ...(input.addressState !== undefined ? { addressState: input.addressState } : {}),
      ...(input.addressPincode !== undefined ? { addressPincode: input.addressPincode } : {}),
      ...(input.addressLandmark !== undefined ? { addressLandmark: input.addressLandmark } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

export async function deleteBranch(retailerId: string, branchId: string) {
  const existing = await prisma.branch.findFirst({ where: { id: branchId, retailerId }, select: { id: true } });
  if (!existing) return false;
  await prisma.branch.delete({ where: { id: branchId } }); // cascades branch managers
  return true;
}

// ── Restock PIN (per branch) ──────────────────────────────────────────────────

export async function setBranchRestockPin(retailerId: string, branchId: string, pin: string) {
  const existing = await prisma.branch.findFirst({ where: { id: branchId, retailerId }, select: { id: true } });
  if (!existing) return false;
  const hash = await hashPassword(pin);
  await prisma.branch.update({ where: { id: branchId }, data: { restockPinHash: hash } });
  return true;
}

export async function clearBranchRestockPin(retailerId: string, branchId: string) {
  const existing = await prisma.branch.findFirst({ where: { id: branchId, retailerId }, select: { id: true } });
  if (!existing) return false;
  await prisma.branch.update({ where: { id: branchId }, data: { restockPinHash: null } });
  return true;
}

// ── Branch managers ───────────────────────────────────────────────────────────

export type BranchManagerInput = {
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  isActive?: boolean;
};

/** List managers for a branch, verifying the branch belongs to this retailer. */
export async function listBranchManagers(retailerId: string, branchId: string) {
  const branch = await prisma.branch.findFirst({ where: { id: branchId, retailerId }, select: { id: true } });
  if (!branch) return null;
  return prisma.branchManager.findMany({
    where: { branchId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true },
  });
}

export async function createBranchManager(retailerId: string, branchId: string, input: BranchManagerInput, createdBy?: string) {
  const branch = await prisma.branch.findFirst({ where: { id: branchId, retailerId }, select: { id: true } });
  if (!branch) return null;
  const email = input.email.toLowerCase().trim();
  const dup = await prisma.branchManager.findFirst({ where: { branchId, email }, select: { id: true } });
  if (dup) return { error: 'duplicate' as const };
  const passwordHash = await hashPassword(input.password || Math.random().toString(36).slice(2) + 'A1');
  const mgr = await prisma.branchManager.create({
    data: { branchId, name: input.name, email, passwordHash, phone: input.phone ?? null, isActive: input.isActive ?? true, createdBy: createdBy ?? null },
    select: { id: true, name: true, email: true, phone: true, isActive: true },
  });
  return { manager: mgr };
}

export async function updateBranchManager(retailerId: string, branchId: string, managerId: string, input: Partial<Omit<BranchManagerInput, 'password'>>) {
  const mgr = await prisma.branchManager.findFirst({ where: { id: managerId, branchId, branch: { retailerId } }, select: { id: true } });
  if (!mgr) return null;
  return prisma.branchManager.update({
    where: { id: managerId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email.toLowerCase().trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, isActive: true },
  });
}

export async function resetBranchManagerPassword(retailerId: string, branchId: string, managerId: string, newPassword: string) {
  const mgr = await prisma.branchManager.findFirst({ where: { id: managerId, branchId, branch: { retailerId } }, select: { id: true } });
  if (!mgr) return false;
  const hash = await hashPassword(newPassword);
  await prisma.branchManager.update({ where: { id: managerId }, data: { passwordHash: hash } });
  return true;
}

export async function deleteBranchManager(retailerId: string, branchId: string, managerId: string) {
  const mgr = await prisma.branchManager.findFirst({ where: { id: managerId, branchId, branch: { retailerId } }, select: { id: true } });
  if (!mgr) return false;
  await prisma.branchManager.delete({ where: { id: managerId } });
  return true;
}
