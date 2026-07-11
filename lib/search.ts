/**
 * Similar-image search: OpenCLIP embedder + Qdrant (manufacturer collection).
 * NODE-ONLY (server). Customers search the global manufacturer catalog.
 */
import { getServerEnv } from '@/lib/env';

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

// ── Qdrant ────────────────────────────────────────────────────────────────────

function qdrantBase(): string {
  const url = getServerEnv().QDRANT_URL;
  if (!url) throw new Error('QDRANT_URL is not configured');
  return url.replace(/\/$/, '');
}
function qdrantHeaders(): Record<string, string> {
  const env = getServerEnv();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.QDRANT_API_KEY) h['api-key'] = env.QDRANT_API_KEY;
  return h;
}
function collection(): string {
  return getServerEnv().QDRANT_MANUFACTURER_COLLECTION;
}

export async function ensureCollection(): Promise<void> {
  const res = await fetch(`${qdrantBase()}/collections/${collection()}`, { headers: qdrantHeaders() });
  if (res.ok) return;
  await fetch(`${qdrantBase()}/collections/${collection()}`, {
    method: 'PUT',
    headers: qdrantHeaders(),
    body: JSON.stringify({ vectors: { size: EMBEDDING_DIM, distance: 'Cosine' } }),
  });
}

export async function upsertVector(pointId: string, vector: number[], payload: Record<string, unknown>): Promise<void> {
  await ensureCollection();
  await fetch(`${qdrantBase()}/collections/${collection()}/points`, {
    method: 'PUT',
    headers: qdrantHeaders(),
    body: JSON.stringify({ points: [{ id: pointId, vector, payload }] }),
  });
}

export async function deleteVector(pointId: string): Promise<void> {
  await fetch(`${qdrantBase()}/collections/${collection()}/points/delete`, {
    method: 'POST',
    headers: qdrantHeaders(),
    body: JSON.stringify({ points: [pointId] }),
  });
}

export async function searchByVector(vector: number[], limit = 24): Promise<{ id: string; score: number }[]> {
  const res = await fetch(`${qdrantBase()}/collections/${collection()}/points/search`, {
    method: 'POST',
    headers: qdrantHeaders(),
    body: JSON.stringify({ vector, limit: Math.min(limit, 100), with_payload: false }),
  });
  if (!res.ok) throw new Error(`qdrant search failed: ${res.status}`);
  const json = (await res.json()) as { result: { id: string; score: number }[] };
  return json.result.map((r) => ({ id: String(r.id), score: r.score }));
}
