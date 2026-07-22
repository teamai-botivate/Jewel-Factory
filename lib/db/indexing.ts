/**
 * Index a manufacturer product's primary image into PostgreSQL pgvector for similar-image
 * search. Fire-and-forget from the image-save route; failures are swallowed so
 * the upload flow never blocks on the embedder being warm.
 */
import { prisma } from '@/lib/prisma';
import { embedImageBase64, upsertVector, EMBEDDING_DIM } from '@/lib/search';

export async function indexManufacturerProduct(productId: string): Promise<void> {
  const product = await prisma.manufacturerProduct.findUnique({
    where: { id: productId },
    include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 } },
  });
  if (!product) return;
  const img = product.images[0];
  if (!img) return;

  // Fetch the image bytes and base64-encode for the embedder helper.
  const bytesRes = await fetch(img.secureUrl);
  if (!bytesRes.ok) return;
  const buf = Buffer.from(await bytesRes.arrayBuffer());
  const base64 = buf.toString('base64');

  const vector = await embedImageBase64(base64);
  await prisma.manufacturerProductEmbedding.upsert({
    where: { productId: product.id },
    update: { qdrantPointId: product.id, embeddingModel: 'open_clip:ViT-B-32:laion2b', dimensions: EMBEDDING_DIM, imageUrl: img.secureUrl },
    create: { productId: product.id, qdrantPointId: product.id, embeddingModel: 'open_clip:ViT-B-32:laion2b', dimensions: EMBEDDING_DIM, imageUrl: img.secureUrl },
  });

  await upsertVector(product.id, vector, {
    manufacturerProductId: product.id,
    manufacturerId: product.manufacturerId,
    category: product.category,
    purity: product.purity,
  });
}
