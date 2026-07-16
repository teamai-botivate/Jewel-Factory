/**
 * One-off data migration — map pre-existing products from the OLD flat 10-category
 * list to the NEW 15-category taxonomy (lib/categories.ts).
 *
 * Run once, after deploying the new category code:
 *   pnpm migrate:categories
 *
 * Safe to re-run: it only rewrites values that still match a legacy key, so
 * products already on the new taxonomy are left untouched. `necklace` → "Set"
 * also sets the sub-category to "Short Set". `anklet` is intentionally left as-is.
 */
import { PrismaClient } from '@prisma/client';

import { LEGACY_CATEGORY_MAP } from '../lib/categories';

const prisma = new PrismaClient();

async function main() {
  let updated = 0;
  let skipped = 0;

  const products = await prisma.manufacturerProduct.findMany({
    select: { id: true, category: true, subCategory: true },
  });

  for (const p of products) {
    const legacy = p.category ?? '';
    if (!(legacy in LEGACY_CATEGORY_MAP)) { skipped++; continue; }

    const target = LEGACY_CATEGORY_MAP[legacy];
    if (target === null) { skipped++; continue; } // e.g. anklet — leave as-is

    // necklace -> Set, and set a sensible sub-category.
    const subCategory = legacy === 'necklace' ? 'Short Set' : p.subCategory;

    await prisma.manufacturerProduct.update({
      where: { id: p.id },
      data: { category: target, subCategory },
    });
    updated++;
    console.log(`  ${p.id}: "${legacy}" -> "${target}"${legacy === 'necklace' ? ' (sub: Short Set)' : ''}`);
  }

  console.log(`\nDone. Updated ${updated} product(s), skipped ${skipped}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
