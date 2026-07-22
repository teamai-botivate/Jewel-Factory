import { prisma } from '../lib/prisma';
import { EMBEDDING_DIM, upsertVector } from '../lib/search';

const qdrantUrl = process.env.QDRANT_URL?.replace(/\/$/, '');
const collection = process.env.QDRANT_MANUFACTURER_COLLECTION ?? 'jewelfactory_manufacturer_products';

if (!qdrantUrl) throw new Error('QDRANT_URL is required for the one-time migration');

type Point = {
  id: string | number;
  vector: number[] | Record<string, number[]>;
  payload?: Record<string, unknown>;
};

async function main() {
  let offset: string | number | null | undefined;
  let migrated = 0;

  do {
    const response = await fetch(`${qdrantUrl}/collections/${collection}/points/scroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.QDRANT_API_KEY ? { 'api-key': process.env.QDRANT_API_KEY } : {}),
      },
      body: JSON.stringify({
        limit: 100,
        offset: offset ?? undefined,
        with_payload: true,
        with_vector: true,
      }),
    });
    if (!response.ok) throw new Error(`Qdrant scroll failed: ${response.status}`);

    const json = (await response.json()) as {
      result: { points: Point[]; next_page_offset?: string | number | null };
    };

    for (const point of json.result.points) {
      const productId = String(point.id);
      const product = await prisma.manufacturerProduct.findUnique({
        where: { id: productId },
        include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 } },
      });
      if (!product) {
        console.warn(`[vector-migration] skipping unknown product ${productId}`);
        continue;
      }

      const vector = Array.isArray(point.vector)
        ? point.vector
        : Object.values(point.vector)[0];
      if (!vector || vector.length !== EMBEDDING_DIM) {
        console.warn(`[vector-migration] skipping invalid vector ${productId}`);
        continue;
      }

      await prisma.manufacturerProductEmbedding.upsert({
        where: { productId },
        update: {
          qdrantPointId: productId,
          embeddingModel: 'open_clip:ViT-B-32:laion2b',
          dimensions: EMBEDDING_DIM,
          imageUrl: product.images[0]?.secureUrl,
        },
        create: {
          productId,
          qdrantPointId: productId,
          embeddingModel: 'open_clip:ViT-B-32:laion2b',
          dimensions: EMBEDDING_DIM,
          imageUrl: product.images[0]?.secureUrl,
        },
      });
      await upsertVector(productId, vector, point.payload ?? {});
      migrated += 1;
    }

    offset = json.result.next_page_offset;
  } while (offset !== null && offset !== undefined);

  console.log(`[vector-migration] migrated ${migrated} vectors into pgvector`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
