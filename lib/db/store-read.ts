import { prisma } from '@/lib/prisma';

/** Read a store's fixed-address fields (used to compute the manufacturer ship-to). */
export async function getStoreById(storeId: string) {
  return prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true, name: true, city: true,
      addressStreet: true, addressLandmark: true, addressCity: true, addressState: true, addressPincode: true,
    },
  });
}
