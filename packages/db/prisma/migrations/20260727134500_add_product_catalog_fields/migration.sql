-- Add product catalog fields required by the current Prisma schema and seed.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" VARCHAR(64);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" VARCHAR(64);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "low_stock_at" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "prep_time_mins" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "addons" JSONB;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allergens" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "products_vendor_id_barcode_key" ON "products"("vendor_id", "barcode");
CREATE INDEX IF NOT EXISTS "products_barcode_idx" ON "products"("barcode");
