-- Dual-vendor ERP tier: per-vendor ERP provider + provisioning state (idempotent)

DO $$ BEGIN
  CREATE TYPE "ErpProvider" AS ENUM ('none', 'simple', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ErpProvisionStatus" AS ENUM ('none', 'pending', 'provisioned', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "erp_provider" "ErpProvider" NOT NULL DEFAULT 'none';
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "erp_provision_status" "ErpProvisionStatus" NOT NULL DEFAULT 'none';
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "erp_provision_error" TEXT;

-- Existing vendors that were already linked to an ERP tenant are treated as
-- embedded/simple + provisioned so current sync behaviour is preserved.
UPDATE "vendors"
   SET "erp_provider" = 'simple',
       "erp_provision_status" = 'provisioned'
 WHERE "erp_tenant_id" IS NOT NULL
   AND "erp_provider" = 'none';
