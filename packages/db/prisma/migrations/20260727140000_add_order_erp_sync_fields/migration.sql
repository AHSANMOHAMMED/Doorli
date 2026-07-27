-- Add ERP sync tracking fields required by the current Prisma schema and seed.
DO $$ BEGIN
  CREATE TYPE "ErpSyncStatus" AS ENUM ('pending', 'synced', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "erp_order_id" VARCHAR(50);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "erp_sync_status" "ErpSyncStatus";
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "erp_sync_error" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "erp_synced_at" TIMESTAMP(3);
