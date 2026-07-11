import { prisma } from '@/lib/prisma';

const DAY = 24 * 60 * 60 * 1000;

export async function getIntelligenceSummary(storeId: string) {
  const now = Date.now();
  const d30 = new Date(now - 30 * DAY);
  const d7 = new Date(now - 7 * DAY);

  const [views7, views30, tryons7, tryons30, sales30, activeProducts] = await Promise.all([
    prisma.productView.count({ where: { storeId, createdAt: { gte: d7 } } }),
    prisma.productView.count({ where: { storeId, createdAt: { gte: d30 } } }),
    prisma.tryonEvent.count({ where: { storeId, createdAt: { gte: d7 } } }),
    prisma.tryonEvent.count({ where: { storeId, createdAt: { gte: d30 } } }),
    prisma.productSale.aggregate({ where: { storeId, soldAt: { gte: d30 } }, _sum: { quantity: true } }),
    prisma.product.count({ where: { storeId, isActive: true } }),
  ]);

  return {
    views7, views30, tryons7, tryons30,
    sales30: sales30._sum.quantity ?? 0,
    activeProducts,
  };
}

export type Rec = { productId: string; name: string; type: string; reason: string; score: number; imageUrl: string | null };

/**
 * Heuristic recommendations. demandScore weights: sales 8x, tryons 2.5x, views 0.25x.
 * Low-stock + high-demand -> restock. High-demand + zero-stock -> restock urgently.
 * No signals but active -> "needs promotion".
 */
export async function getRecommendations(storeId: string): Promise<Rec[]> {
  const now = Date.now();
  const d90 = new Date(now - 90 * DAY);

  const products = await prisma.product.findMany({
    where: { storeId, isActive: true },
    take: 200,
    select: {
      id: true, name: true, stockCount: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      _count: {
        select: {
          views: { where: { createdAt: { gte: d90 } } },
          tryonEvents: { where: { createdAt: { gte: d90 } } },
          sales: { where: { soldAt: { gte: d90 } } },
        },
      },
    },
  });

  const recs: Rec[] = [];
  for (const p of products) {
    const demand = p._count.sales * 8 + p._count.tryonEvents * 2.5 + p._count.views * 0.25;
    const img = p.images[0]?.url ?? null;
    if (demand > 5 && p.stockCount === 0) {
      recs.push({ productId: p.id, name: p.name, type: 'restock', reason: 'High demand but out of stock', score: demand + 20, imageUrl: img });
    } else if (demand > 5 && p.stockCount <= 2) {
      recs.push({ productId: p.id, name: p.name, type: 'restock', reason: 'High demand, low stock', score: demand + 10, imageUrl: img });
    } else if (demand === 0 && p.stockCount > 0) {
      recs.push({ productId: p.id, name: p.name, type: 'promote', reason: 'No recent interest — consider promoting', score: 1, imageUrl: img });
    }
  }
  return recs.sort((a, b) => b.score - a.score).slice(0, 12);
}
