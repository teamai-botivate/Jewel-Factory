-- Every retailer gets 2 free branches (Stores). To exceed that they contact
-- the manufacturer, who grants extra allowance on this column (editable at any
-- time, not one-time) — effective branch limit = 2 + extra_branch_allowance.
-- Idempotent: safe to re-run (matches the hand-authored branch_hierarchy style).

ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "extra_branch_allowance" INTEGER NOT NULL DEFAULT 0;
