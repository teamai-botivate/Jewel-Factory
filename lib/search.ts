/**
 * Similar-image search: OpenCLIP embedder + PostgreSQL pgvector.
 * NODE-ONLY (server). Customers search the global manufacturer catalog.
 */
import { getServerEnv } from '@/lib/env';
import { prisma } from '@/lib/prisma';

export const EMBEDDING_DIM = 512;

function embedderBase(): string {
  const url = getServerEnv().EMBEDDER_URL;
  if (!url) throw new Error('EMBEDDER_URL is not configured');
  return url.replace(/\/$/, '');
}
function embedderHeaders(): Record<string, string> {
  const key = getServerEnv().EMBEDDER_API_KEY;
  return key ? { Authorization: `Bearer ${key}` } : {};
}

export async function embedImageBase64(base64: string): Promise<number[]> {
  const bytes = Uint8Array.from(atob(base64.replace(/^data:image\/\w+;base64,/, '')), (c) => c.charCodeAt(0));
  const form = new FormData();
  form.append('file', new Blob([bytes]), 'query.jpg');
  const res = await fetch(`${embedderBase()}/embed/image`, {
    method: 'POST',
    headers: embedderHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`embedder image failed: ${res.status}`);
  const json = (await res.json()) as { embedding: number[] };
  return json.embedding;
}

export async function ensureCollection(): Promise<void> {
  // The pgvector extension and vector column are installed by Prisma migration.
  await prisma.$queryRawUnsafe('SELECT 1 FROM pg_extension WHERE extname = \'vector\'');
}

export async function upsertVector(pointId: string, vector: number[], payload: Record<string, unknown>): Promise<void> {
  if (vector.length !== EMBEDDING_DIM) throw new Error(`Expected ${EMBEDDING_DIM}-dimension embedding`);
  await prisma.$executeRawUnsafe(
    `UPDATE manufacturer_product_embeddings
       SET embedding = $2::vector, metadata = $3::jsonb, indexed_at = NOW()
     WHERE product_id = $1`,
    pointId,
    `[${vector.join(',')}]`,
    JSON.stringify(payload),
  );
}

export async function deleteVector(pointId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    'UPDATE manufacturer_product_embeddings SET embedding = NULL, metadata = NULL WHERE product_id = $1',
    pointId,
  );
}

export async function searchByVector(vector: number[], limit = 24): Promise<{ id: string; score: number }[]> {
  if (vector.length !== EMBEDDING_DIM) throw new Error(`Expected ${EMBEDDING_DIM}-dimension embedding`);
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 100));
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; score: number }>>(
    `SELECT product_id AS id, (1 - (embedding <=> $1::vector))::double precision AS score
       FROM manufacturer_product_embeddings
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT ${safeLimit}`,
    `[${vector.join(',')}]`,
  );
  return rows.map((row) => ({ id: row.id, score: Number(row.score) }));
}
