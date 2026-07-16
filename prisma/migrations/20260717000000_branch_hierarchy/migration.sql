-- Branch hierarchy: a Retailer (stores table) now has multiple Branches, each
-- with its own Branch Managers, restock PIN, and fixed address. Orders can carry
-- a branchId + an editable requirement note. Kiosk customer PII becomes optional.
--
-- Hand-authored (Supabase pooler times out under `prisma migrate dev`; see CLAUDE.md).
-- Written with IF NOT EXISTS / DROP NOT NULL so a partial re-run is safe.

-- ── branches ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "branches" (
  "id"               TEXT PRIMARY KEY,
  "retailer_id"      TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "address_street"   TEXT,
  "address_city"     TEXT,
  "address_state"    TEXT,
  "address_pincode"  TEXT,
  "address_landmark" TEXT,
  "phone"            TEXT,
  "restock_pin_hash" TEXT,
  "is_active"        BOOLEAN NOT NULL DEFAULT true,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
  ALTER TABLE "branches"
    ADD CONSTRAINT "branches_retailer_id_fkey"
    FOREIGN KEY ("retailer_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "branches_retailer_id_idx" ON "branches"("retailer_id");

-- ── branch_managers ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "branch_managers" (
  "id"            TEXT PRIMARY KEY,
  "branch_id"     TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "email"         TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "phone"         TEXT,
  "is_active"     BOOLEAN NOT NULL DEFAULT true,
  "created_by"    TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
  ALTER TABLE "branch_managers"
    ADD CONSTRAINT "branch_managers_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "branch_managers_branch_id_email_key" ON "branch_managers"("branch_id", "email");
CREATE INDEX IF NOT EXISTS "branch_managers_email_idx" ON "branch_managers"("email");

-- ── kiosk_orders: branch link + editable note; make customer PII optional ─────
ALTER TABLE "kiosk_orders" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "kiosk_orders" ADD COLUMN IF NOT EXISTS "branch_name_snapshot" TEXT;
ALTER TABLE "kiosk_orders" ADD COLUMN IF NOT EXISTS "requirement_note" TEXT;
ALTER TABLE "kiosk_orders" ALTER COLUMN "customer_name" DROP NOT NULL;
ALTER TABLE "kiosk_orders" ALTER COLUMN "customer_phone" DROP NOT NULL;
DO $$ BEGIN
  ALTER TABLE "kiosk_orders"
    ADD CONSTRAINT "kiosk_orders_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── b2b_orders: branch link + editable note ──────────────────────────────────
ALTER TABLE "b2b_orders" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "b2b_orders" ADD COLUMN IF NOT EXISTS "branch_name_snapshot" TEXT;
ALTER TABLE "b2b_orders" ADD COLUMN IF NOT EXISTS "requirement_note" TEXT;
DO $$ BEGIN
  ALTER TABLE "b2b_orders"
    ADD CONSTRAINT "b2b_orders_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── custom_design_requests: branch link; make customer PII optional ───────────
ALTER TABLE "custom_design_requests" ADD COLUMN IF NOT EXISTS "branch_id" TEXT;
ALTER TABLE "custom_design_requests" ALTER COLUMN "customer_name" DROP NOT NULL;
ALTER TABLE "custom_design_requests" ALTER COLUMN "customer_phone" DROP NOT NULL;
DO $$ BEGIN
  ALTER TABLE "custom_design_requests"
    ADD CONSTRAINT "custom_design_requests_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
