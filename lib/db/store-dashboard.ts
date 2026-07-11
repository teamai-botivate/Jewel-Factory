import { prisma } from '@/lib/prisma';

export async function getStoreDashboard(storeId: string) {
  const [pendingKiosk, pendingB2b, pendingCustom, totalKiosk, totalB2b, totalCustom] = await Promise.all([
    prisma.kioskOrder.count({ where: { storeId, pendingStoreApproval: true, status: { not: 'CANCELLED' } } }),
    prisma.b2bOrder.count({ where: { storeId, pendingManagerApproval: true, status: { not: 'CANCELLED' } } }),
    prisma.customDesignRequest.count({ where: { storeId, status: 'PENDING' } }),
    prisma.kioskOrder.count({ where: { storeId } }),
    prisma.b2bOrder.count({ where: { storeId } }),
    prisma.customDesignRequest.count({ where: { storeId } }),
  ]);
  return {
    pendingKiosk, pendingB2b, pendingCustom,
    totalKiosk, totalB2b, totalCustom,
    pendingTotal: pendingKiosk + pendingB2b + pendingCustom,
  };
}
