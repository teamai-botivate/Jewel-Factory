/**
 * One-off data migration for the Branch hierarchy (Option A — keep old data).
 *
 * The old model:  Store (owner) -> StoreManager        + kiosk orders on the store
 * The new model:  Store = RETAILER, StoreManager = HO MANAGER,
 *                 and each retailer now has BRANCHes with BranchManagers.
 *
 * This script, for every existing retailer (stores row), ensures a default
 * "Main Store" branch exists, and back-links existing kiosk/B2B/custom-design
 * records to that default branch so nothing is orphaned.
 *
 * Run AFTER the 20260717000000_branch_hierarchy migration is applied:
 *   pnpm migrate:branches
 *
 * Safe to re-run: it skips retailers that already have a branch, and only sets
 * branchId on records that don't have one yet.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const retailers = await prisma.store.findMany({ select: { id: true, name: true, city: true, addressStreet: true, addressCity: true, addressState: true, addressPincode: true, addressLandmark: true, phone: true } });

  let branchesCreated = 0;
  let ordersLinked = 0;

  for (const r of retailers) {
    // Does this retailer already have any branch? If yes, reuse the first.
    let branch = await prisma.branch.findFirst({ where: { retailerId: r.id }, orderBy: { createdAt: 'asc' } });

    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          retailerId: r.id,
          name: 'Main Store',
          // copy the retailer's address onto the default branch as a starting point
          addressStreet: r.addressStreet,
          addressCity: r.addressCity ?? r.city,
          addressState: r.addressState,
          addressPincode: r.addressPincode,
          addressLandmark: r.addressLandmark,
          phone: r.phone,
          isActive: true,
        },
      });
      branchesCreated++;
      console.log(`  Retailer "${r.name}": created default branch "Main Store"`);
    }

    // Back-link existing orders/requests that have no branch yet.
    const k = await prisma.kioskOrder.updateMany({ where: { storeId: r.id, branchId: null }, data: { branchId: branch.id, branchNameSnapshot: branch.name } });
    const b = await prisma.b2bOrder.updateMany({ where: { storeId: r.id, branchId: null }, data: { branchId: branch.id, branchNameSnapshot: branch.name } });
    const c = await prisma.customDesignRequest.updateMany({ where: { storeId: r.id, branchId: null }, data: { branchId: branch.id } });
    ordersLinked += k.count + b.count + c.count;
  }

  console.log(`\nDone. Retailers: ${retailers.length}. Default branches created: ${branchesCreated}. Records linked to a branch: ${ordersLinked}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
