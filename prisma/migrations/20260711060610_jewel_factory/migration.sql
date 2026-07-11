-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResetRole" AS ENUM ('STORE_OWNER', 'STORE_MANAGER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JewelleryType" AS ENUM ('necklace', 'earring_left', 'earring_right', 'ring_index', 'ring_middle', 'bangle');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FORWARDED');

-- CreateEnum
CREATE TYPE "CustomOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "manufacturer_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "registration_status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "registration_submitted_at" TIMESTAMP(3),
    "registration_reviewed_at" TIMESTAMP(3),
    "owner_name" TEXT,
    "owner_phone" TEXT,
    "logo_url" TEXT,
    "tagline" TEXT,
    "website_url" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "address_street" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_pincode" TEXT,
    "address_landmark" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_managers" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ResetRole" NOT NULL,
    "store_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_products" (
    "id" TEXT NOT NULL,
    "manufacturer_id" TEXT NOT NULL,
    "design_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "sub_category" TEXT,
    "description" TEXT,
    "weight_grams" DECIMAL(8,3),
    "purity" TEXT,
    "gemstones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "occasion_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "style_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "min_order_qty" INTEGER NOT NULL DEFAULT 1,
    "has_tryon" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturer_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "cloudinary_public_id" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_product_embeddings" (
    "product_id" TEXT NOT NULL,
    "qdrant_point_id" TEXT NOT NULL,
    "embedding_model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "image_url" TEXT,
    "indexed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_product_embeddings_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "manufacturer_product_id" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "purity" TEXT,
    "weight_grams" DECIMAL(8,2),
    "gemstones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "occasion_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "style_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stock_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "cloudinary_public_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tryon_assets" (
    "id" TEXT NOT NULL,
    "manufacturer_product_id" TEXT,
    "product_id" TEXT,
    "cloudinary_public_id" TEXT,
    "asset_url" TEXT NOT NULL,
    "jewellery_type" "JewelleryType" NOT NULL,
    "pivot_x" DECIMAL(5,3) NOT NULL DEFAULT 0.5,
    "pivot_y" DECIMAL(5,3) NOT NULL DEFAULT 0.5,
    "x_offset" DECIMAL(8,3) NOT NULL DEFAULT 0,
    "y_offset" DECIMAL(8,3) NOT NULL DEFAULT 0,
    "scale_multiplier" DECIMAL(5,3) NOT NULL DEFAULT 1,
    "rotation_offset_deg" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "width_mm" DECIMAL(6,2),
    "height_mm" DECIMAL(6,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_tryon_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_orders" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "manufacturer_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "delivery_address" TEXT NOT NULL,
    "notes" TEXT,
    "tracking_number" TEXT,
    "pending_manager_approval" BOOLEAN NOT NULL DEFAULT true,
    "manager_approved_by_id" TEXT,
    "manager_approved_at" TIMESTAMP(3),
    "fulfilled_at" TIMESTAMP(3),
    "fulfilled_product_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "manufacturer_product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "product_name_snapshot" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_order_status_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kiosk_orders" (
    "id" TEXT NOT NULL,
    "manufacturer_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_name_snapshot" TEXT NOT NULL,
    "store_city_snapshot" TEXT,
    "store_phone_snapshot" TEXT,
    "store_email_snapshot" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "delivery_address" TEXT,
    "pickup_store" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "order_number" TEXT NOT NULL,
    "order_source" TEXT NOT NULL DEFAULT 'kiosk',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "tracking_number" TEXT,
    "pending_store_approval" BOOLEAN NOT NULL DEFAULT true,
    "store_approved_by_id" TEXT,
    "store_approved_at" TIMESTAMP(3),
    "forwarded_to_manufacturer" BOOLEAN NOT NULL DEFAULT false,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kiosk_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kiosk_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "manufacturer_product_id" TEXT,
    "product_name_snapshot" TEXT NOT NULL,
    "product_image_snapshot" TEXT,
    "category_snapshot" TEXT,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kiosk_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kiosk_order_status_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "changed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kiosk_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_design_requests" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_notes" TEXT,
    "reference_image_url" TEXT,
    "reference_image_public_id" TEXT,
    "category" TEXT NOT NULL,
    "weight_grams" DECIMAL(8,3),
    "purity" TEXT,
    "design_notes" TEXT,
    "status" "CustomStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_design_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_design_orders" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "manufacturer_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_name_snapshot" TEXT NOT NULL,
    "store_address_snapshot" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "weight_grams" DECIMAL(8,3),
    "purity" TEXT,
    "reference_image_url" TEXT,
    "design_notes" TEXT,
    "status" "CustomOrderStatus" NOT NULL DEFAULT 'PENDING',
    "order_number" TEXT NOT NULL,
    "tracking_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_design_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_views" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tryon_events" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT,
    "jewellery_type" TEXT,
    "confidence" DECIMAL(5,3),
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tryon_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_sales" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sold_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occasion" TEXT,
    "notes" TEXT,

    CONSTRAINT "product_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_email_key" ON "manufacturers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "stores_email_key" ON "stores"("email");

-- CreateIndex
CREATE INDEX "store_managers_email_idx" ON "store_managers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "store_managers_store_id_email_key" ON "store_managers"("store_id", "email");

-- CreateIndex
CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens"("email");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_products_design_number_key" ON "manufacturer_products"("design_number");

-- CreateIndex
CREATE INDEX "manufacturer_products_status_idx" ON "manufacturer_products"("status");

-- CreateIndex
CREATE INDEX "manufacturer_products_category_idx" ON "manufacturer_products"("category");

-- CreateIndex
CREATE INDEX "manufacturer_product_images_product_id_idx" ON "manufacturer_product_images"("product_id");

-- CreateIndex
CREATE INDEX "products_store_id_is_active_idx" ON "products"("store_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_slug_key" ON "products"("store_id", "slug");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "product_tryon_assets_manufacturer_product_id_idx" ON "product_tryon_assets"("manufacturer_product_id");

-- CreateIndex
CREATE INDEX "product_tryon_assets_product_id_idx" ON "product_tryon_assets"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_orders_order_number_key" ON "b2b_orders"("order_number");

-- CreateIndex
CREATE INDEX "b2b_orders_store_id_idx" ON "b2b_orders"("store_id");

-- CreateIndex
CREATE INDEX "b2b_orders_manufacturer_id_idx" ON "b2b_orders"("manufacturer_id");

-- CreateIndex
CREATE INDEX "b2b_orders_status_idx" ON "b2b_orders"("status");

-- CreateIndex
CREATE INDEX "b2b_order_items_order_id_idx" ON "b2b_order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "kiosk_orders_order_number_key" ON "kiosk_orders"("order_number");

-- CreateIndex
CREATE INDEX "kiosk_orders_store_id_idx" ON "kiosk_orders"("store_id");

-- CreateIndex
CREATE INDEX "kiosk_orders_manufacturer_id_idx" ON "kiosk_orders"("manufacturer_id");

-- CreateIndex
CREATE INDEX "kiosk_orders_status_idx" ON "kiosk_orders"("status");

-- CreateIndex
CREATE INDEX "kiosk_order_items_order_id_idx" ON "kiosk_order_items"("order_id");

-- CreateIndex
CREATE INDEX "custom_design_requests_store_id_idx" ON "custom_design_requests"("store_id");

-- CreateIndex
CREATE INDEX "custom_design_requests_status_idx" ON "custom_design_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "custom_design_orders_request_id_key" ON "custom_design_orders"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_design_orders_order_number_key" ON "custom_design_orders"("order_number");

-- CreateIndex
CREATE INDEX "custom_design_orders_manufacturer_id_idx" ON "custom_design_orders"("manufacturer_id");

-- CreateIndex
CREATE INDEX "custom_design_orders_store_id_idx" ON "custom_design_orders"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "product_views_store_id_created_at_idx" ON "product_views"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "tryon_events_store_id_created_at_idx" ON "tryon_events"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "product_sales_store_id_sold_at_idx" ON "product_sales"("store_id", "sold_at");

-- CreateIndex
CREATE INDEX "product_sales_store_id_product_id_idx" ON "product_sales"("store_id", "product_id");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_managers" ADD CONSTRAINT "store_managers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturer_products" ADD CONSTRAINT "manufacturer_products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturer_product_images" ADD CONSTRAINT "manufacturer_product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "manufacturer_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturer_product_embeddings" ADD CONSTRAINT "manufacturer_product_embeddings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "manufacturer_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tryon_assets" ADD CONSTRAINT "product_tryon_assets_manufacturer_product_id_fkey" FOREIGN KEY ("manufacturer_product_id") REFERENCES "manufacturer_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tryon_assets" ADD CONSTRAINT "product_tryon_assets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_orders" ADD CONSTRAINT "b2b_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_orders" ADD CONSTRAINT "b2b_orders_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_order_items" ADD CONSTRAINT "b2b_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "b2b_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_order_items" ADD CONSTRAINT "b2b_order_items_manufacturer_product_id_fkey" FOREIGN KEY ("manufacturer_product_id") REFERENCES "manufacturer_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_order_status_history" ADD CONSTRAINT "b2b_order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "b2b_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kiosk_orders" ADD CONSTRAINT "kiosk_orders_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kiosk_orders" ADD CONSTRAINT "kiosk_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kiosk_order_items" ADD CONSTRAINT "kiosk_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "kiosk_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kiosk_order_status_history" ADD CONSTRAINT "kiosk_order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "kiosk_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_design_requests" ADD CONSTRAINT "custom_design_requests_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_design_orders" ADD CONSTRAINT "custom_design_orders_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "custom_design_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_design_orders" ADD CONSTRAINT "custom_design_orders_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_design_orders" ADD CONSTRAINT "custom_design_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tryon_events" ADD CONSTRAINT "tryon_events_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sales" ADD CONSTRAINT "product_sales_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
