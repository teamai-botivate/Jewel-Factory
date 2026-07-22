CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "manufacturer_product_embeddings"
  ADD COLUMN IF NOT EXISTS "embedding" vector(512),
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE INDEX IF NOT EXISTS "manufacturer_product_embeddings_embedding_hnsw_idx"
  ON "manufacturer_product_embeddings"
  USING hnsw ("embedding" vector_cosine_ops);
