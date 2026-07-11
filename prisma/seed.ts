/**
 * Seed script — run with `pnpm db:seed` (after `pnpm db:migrate`).
 *
 * Seeds:
 *   1. One manufacturer (no signup UI — must be seeded)
 *   2. The category list
 *   3. (optional) a demo approved store for local testing
 *
 * The manufacturer password is read from SEED_MANUFACTURER_PASSWORD (or defaults
 * to a dev value). Change it before any real deployment.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'ring', name: 'Ring' },
  { slug: 'earring', name: 'Earring' },
  { slug: 'necklace', name: 'Necklace' },
  { slug: 'bangle', name: 'Bangle' },
  { slug: 'bracelet', name: 'Bracelet' },
  { slug: 'pendant', name: 'Pendant' },
  { slug: 'chain', name: 'Chain' },
  { slug: 'nose-pin', name: 'Nose Pin' },
  { slug: 'anklet', name: 'Anklet' },
  { slug: 'mangalsutra', name: 'Mangalsutra' },
];

async function main() {
  // 1. Categories
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: i },
      create: { slug: c.slug, name: c.name, sortOrder: i },
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  // 2. Manufacturer
  const mfrEmail = process.env.SEED_MANUFACTURER_EMAIL ?? 'admin@atjewellers.com';
  const mfrPassword = process.env.SEED_MANUFACTURER_PASSWORD ?? 'manufacturer123';
  const passwordHash = await bcrypt.hash(mfrPassword, 10);

  const manufacturer = await prisma.manufacturer.upsert({
    where: { email: mfrEmail },
    update: {},
    create: {
      name: 'AT Jewellers',
      email: mfrEmail,
      passwordHash,
    },
  });
  console.log(`Seeded manufacturer: ${manufacturer.email}`);
  console.log(`  (login password: ${mfrPassword} — change before production)`);

  // 3. Optional demo store (approved) for local testing
  if (process.env.SEED_DEMO_STORE === 'true') {
    const storePasswordHash = await bcrypt.hash('store123', 10);
    const managerPasswordHash = await bcrypt.hash('manager123', 10);
    const store = await prisma.store.upsert({
      where: { slug: 'demo' },
      update: {},
      create: {
        manufacturerId: manufacturer.id,
        name: 'Demo Store',
        slug: 'demo',
        email: 'store@demo.com',
        passwordHash: storePasswordHash,
        registrationStatus: 'APPROVED',
        isActive: true,
        city: 'Raipur',
        addressStreet: 'Main Road',
        addressCity: 'Raipur',
        addressState: 'Chhattisgarh',
        addressPincode: '492001',
        managers: {
          create: {
            name: 'Demo Manager',
            email: 'manager@demo.com',
            passwordHash: managerPasswordHash,
          },
        },
      },
    });
    console.log(`Seeded demo store: /${store.slug} (store@demo.com / manager@demo.com)`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
