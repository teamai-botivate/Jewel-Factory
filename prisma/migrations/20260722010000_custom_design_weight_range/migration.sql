-- Custom design weight becomes a range (weight_grams_min / weight_grams_max)
-- instead of a single value — jewellery weight is rarely exact, and this lets
-- the Store Manager give the manufacturer a realistic "from - to" estimate.
-- Idempotent: safe to re-run (matches the hand-authored branch_hierarchy style).

-- custom_design_requests
ALTER TABLE "custom_design_requests" ADD COLUMN IF NOT EXISTS "weight_grams_min" DECIMAL(8,3);
ALTER TABLE "custom_design_requests" ADD COLUMN IF NOT EXISTS "weight_grams_max" DECIMAL(8,3);
UPDATE "custom_design_requests"
  SET "weight_grams_min" = "weight_grams", "weight_grams_max" = "weight_grams"
  WHERE "weight_grams" IS NOT NULL AND "weight_grams_min" IS NULL;
ALTER TABLE "custom_design_requests" DROP COLUMN IF EXISTS "weight_grams";

-- custom_design_orders (sanitized snapshot forwarded to the manufacturer)
ALTER TABLE "custom_design_orders" ADD COLUMN IF NOT EXISTS "weight_grams_min" DECIMAL(8,3);
ALTER TABLE "custom_design_orders" ADD COLUMN IF NOT EXISTS "weight_grams_max" DECIMAL(8,3);
UPDATE "custom_design_orders"
  SET "weight_grams_min" = "weight_grams", "weight_grams_max" = "weight_grams"
  WHERE "weight_grams" IS NOT NULL AND "weight_grams_min" IS NULL;
ALTER TABLE "custom_design_orders" DROP COLUMN IF EXISTS "weight_grams";
