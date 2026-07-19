# Jewel Factory — AWS Migration Plan

Shift the whole stack to AWS, phase by phase. App keeps running until each phase
is verified. Decisions (locked):

- **Order:** phase-wise (DB → pgvector → S3 → EC2). Each phase tested before the next.
- **DB:** Supabase → **RDS PostgreSQL** (Prisma provider stays `postgresql`).
- **Vectors:** Qdrant → **pgvector** in the SAME RDS, column on `manufacturer_product_embeddings` (option A).
- **Storage:** Cloudinary → **S3 + CloudFront CDN** (S3 private, served via CloudFront).
- **App + AI:** Render → **EC2** (SSH via .pem). AI-Features (embedder + catalog/describe) also on EC2.

> This is a PLAN. No code changed yet. Recon of every touch-point is baked in below.

---

## Why the code change is small
Cloudinary and Qdrant are cleanly isolated:
- **All Qdrant** = `lib/search.ts` (4 fns: `ensureCollection`, `upsertVector`, `deleteVector`, `searchByVector`).
- **All Cloudinary** = `lib/cloudinary.ts` (server sign/delete) + `lib/upload-client.ts` (browser) + **2 inline upload flows** in custom-design pages.
- Prisma is already `postgresql` → RDS needs only a connection-string change.
Business logic, DB helpers, pages: mostly untouched (only image-URL host + 3 upload flows + search internals change).

---

## PHASE 1 — Database → RDS PostgreSQL

**AWS:**
1. Create **RDS PostgreSQL** (v15+; enable `pgvector` support — RDS PG 15+ has it).
2. Security group: allow the app (EC2) to reach port 5432. For local migration, temporarily allow your IP.
3. Note the endpoint + master user/password.

**App (`.env` only — NO code change):**
```
DATABASE_URL="postgresql://<user>:<pass>@<rds-endpoint>:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://<user>:<pass>@<rds-endpoint>:5432/postgres?sslmode=require"
```
(RDS has one port, so DATABASE_URL and DIRECT_URL can be the same; keep `sslmode=require`.)

**Build the schema + move data:**
```bash
pnpm db:deploy          # runs all 5 migrations on RDS (full schema)
# then migrate existing rows from Supabase:
pg_dump "<supabase DIRECT_URL>" --data-only --no-owner -Fc -f data.dump
pg_restore --data-only --no-owner -d "<rds DATABASE_URL>" data.dump
pnpm db:seed            # only if starting fresh (skips existing via upsert)
```
**Verify:** login as manufacturer/retailer, orders load, catalog shows.
**Code change:** none.

---

## PHASE 2 — Vectors → pgvector (option A)

**RDS:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE manufacturer_product_embeddings ADD COLUMN IF NOT EXISTS embedding vector(512);
CREATE INDEX IF NOT EXISTS mpe_embedding_idx
  ON manufacturer_product_embeddings USING hnsw (embedding vector_cosine_ops);
```
Ship this as a new hand-authored Prisma migration (idempotent) so fresh DBs get it too.
Schema: add `embedding Unsupported("vector(512)")?` to `ManufacturerProductEmbedding`
(Prisma has no native vector type — the column is written/read via raw SQL).

**Code — replace the Qdrant internals in `lib/search.ts` (same function names, so callers don't change):**
- `upsertVector(pointId, vector, payload)` → raw SQL: `UPDATE manufacturer_product_embeddings SET embedding = $1::vector WHERE product_id = $2` (or upsert the row). Drop the `payload`/`ensureCollection` calls.
- `searchByVector(vector, limit)` → raw SQL:
  ```sql
  SELECT product_id AS id, 1 - (embedding <=> $1::vector) AS score
  FROM manufacturer_product_embeddings
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> $1::vector
  LIMIT $2;
  ```
  (`<=>` = cosine distance; ANN via the hnsw index.)
- `deleteVector(pointId)` → `UPDATE ... SET embedding = NULL` (or delete row).
- `ensureCollection()` → remove (no collection concept).
- `embedImageBase64` (embedder call) — **unchanged**.

**`lib/db/indexing.ts`** — unchanged in flow: fetch image → embed → now `upsertVector` writes pgvector (was Qdrant). It already writes the `manufacturer_product_embeddings` row.
**Search routes** (`kiosk.ts`, `branch-manager.ts`) — unchanged (they call `searchByVector` + hydrate by IDs; can optionally simplify since pgvector already returns ordered ids).

**Backfill vectors:** re-index all products (embedder is the same), or copy from Qdrant. A small script: for each manufacturer product with a primary image, call `indexManufacturerProduct(id)`.

**Env:** remove `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_MANUFACTURER_COLLECTION`.
**Verify:** `/search` (visual) returns matches from RDS.

---

## PHASE 3 — Storage → S3 + CloudFront

**AWS:**
1. Create **S3 bucket** (private). Keep the SAME key layout as Cloudinary folders:
   ```
   jewelfactory/manufacturer/<manufacturerId>/catalog/
   jewelfactory/manufacturer/<manufacturerId>/tryon/
   jewelfactory/store/<storeId>/logo/
   jewelfactory/store/<storeId>/custom/
   ```
2. **CloudFront** distribution in front of the bucket (OAC — origin access control; bucket stays private).
3. **CORS** on the bucket (browser direct upload + AR canvas reads tryon PNGs cross-origin): allow `PUT/POST/GET` from the app origin, expose `ETag`.
4. IAM: an EC2 role (or access key) with `s3:PutObject`/`GetObject`/`DeleteObject` on that bucket.

**Code:**
- **`lib/cloudinary.ts` → `lib/s3.ts`**: `signUpload({folder,bucket,publicId})` returns an **S3 presigned PUT** (via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) + the final CloudFront URL. Keep the folder helpers (`manufacturerFolder`, `storeFolder`) and formats/MAX_BYTES. Implement `deleteAsset` (currently unused, but wire cleanup while here).
- **`lib/upload-client.ts`**: upload via the presigned URL (PUT the file bytes; no `api_key/signature` fields). Return `{ secureUrl: cloudFrontUrl, publicId: s3Key }`.
- **2 inline upload flows** — `app/[storeSlug]/custom-design/page.tsx` (~L45-60) and `app/store-manager/custom-design/page.tsx` (~L31-44): switch to the presigned PUT too (or refactor both to use `upload-client`).
- **`next.config.ts`**: replace `res.cloudinary.com` in `images.remotePatterns` with the CloudFront host.
- DB columns stay the same (they just hold CloudFront URLs now): `manufacturer_product_images.secure_url/cloudinary_public_id`, `product_images.url`, `tryon_assets.asset_url`, `stores.logo_url`, `custom_design_requests.reference_image_url/…public_id`.
- **`indexing.ts` L~19** fetches the image URL before embedding — it'll now fetch from CloudFront (works the same).

**Data migrate (Cloudinary → S3):** script — for every stored image URL, download from Cloudinary → upload to S3 at the same key → update the DB column to the CloudFront URL.

**Env:** remove `CLOUDINARY_*`; add `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_URL` (+ IAM creds if not using an EC2 role).
**Verify:** upload a new product image → shows via CloudFront; try-on PNG loads in AR.

---

## PHASE 4 — Deploy on EC2 (app + AI-Features)

**App (Jewel Factory):**
1. EC2 (Ubuntu, t3.small+). SSH with the .pem.
2. Install Node 20 + pnpm + PM2 (or Docker) + nginx.
3. Clone repo, `.env` (RDS + S3 + secrets + AI URLs), `pnpm install && pnpm build`.
4. Start: `pnpm render-start` (migrate deploy + next start) under PM2, or a systemd/Docker unit.
5. **nginx** reverse proxy → app port; **SSL** via Let's Encrypt (certbot); point domain.
6. `NEXT_PUBLIC_APP_URL` + `ALLOWED_ORIGINS` → the real domain; `NODE_ENV=production`.

**AI-Features on EC2** (from `Jewel-Factory_AI` repo):
1. Same EC2 (or a separate one — torch is heavy; a bigger instance is better). Docker is easiest (its Dockerfile is ready).
2. `docker build` + run on port 7860; set `OPENAI_API_KEY` (+ keys).
3. App env: `AI_FEATURES_URL` + `EMBEDDER_URL` → the AI-Features address (internal EC2 URL or its own domain).
4. First `/embed` call downloads the CLIP model (~350 MB) once.

**Verify:** full E2E on the AWS domain (see PENDING.md test list) — login flows, kiosk, orders, chat, photo search, Generate-with-AI.

---

## Order of operations (safe cutover)
1. Phase 1 (RDS) — data copied, app still on Render pointing at… keep Render on Supabase until ready; do RDS on a staging env first.
2. Phase 2 (pgvector) — on the RDS.
3. Phase 3 (S3) — migrate assets, flip URLs.
4. Phase 4 (EC2) — deploy app+AI, point env at RDS+S3+AI, switch DNS. Then retire Render/Supabase/Cloudinary/Qdrant/HF.

## New env (final, AWS)
```
DATABASE_URL / DIRECT_URL   -> RDS
(no QDRANT_*)               -> pgvector in RDS
AWS_REGION, S3_BUCKET, CLOUDFRONT_URL, (IAM creds or EC2 role)   -> storage
EMBEDDER_URL, AI_FEATURES_URL, *_API_KEY  -> AI-Features on EC2
NEXT_PUBLIC_APP_URL, ALLOWED_ORIGINS, NODE_ENV=production
+ the 4 auth secrets, SMTP, OPENAI_API_KEY (on AI service)
```

## Deps to add
- App: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (remove nothing; Cloudinary was fetch-based).
- DB: pgvector extension on RDS.

## Code touch-points (exact — from recon)
- `lib/search.ts` (Qdrant → pgvector; keep fn names)
- `lib/cloudinary.ts` → `lib/s3.ts` (presigned S3 + CloudFront)
- `lib/upload-client.ts` (+ 2 inline flows in custom-design pages)
- `next.config.ts` (image host)
- `prisma/schema.prisma` + new migration (vector column) ; `lib/env.ts` (swap env vars)
- `lib/db/indexing.ts` (no logic change; now writes pgvector, reads S3 URL)
- No change: DB helpers, order/chat/auth logic, most pages (they read the same URL columns).

## Migration-critical gotchas (from recon)
- **No delete/cleanup exists today** (`deleteAsset`, `deleteVector` unused) — add S3 lifecycle + vector cleanup while migrating.
- **Three client upload code paths** (upload-client + 2 inline) — update all three.
- **CORS on S3/CloudFront** is mandatory (AR canvas reads tryon PNGs cross-origin).
- **Prisma can't type `vector`** — use `Unsupported("vector(512)")` + `$queryRaw`.
- Column-name inconsistency: `secure_url` (mfr images) vs `url` (retail) vs `asset_url` (tryon) — keep as-is, just store CloudFront URLs.
