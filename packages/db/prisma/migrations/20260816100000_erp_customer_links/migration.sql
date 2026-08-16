CREATE TABLE IF NOT EXISTS "erp_customer_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "erp_customer_id" VARCHAR(140) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "erp_customer_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "erp_customer_links_vendor_id_erp_customer_id_key"
    ON "erp_customer_links"("vendor_id", "erp_customer_id");
CREATE INDEX IF NOT EXISTS "erp_customer_links_user_id_idx"
    ON "erp_customer_links"("user_id");

DO $$ BEGIN
  ALTER TABLE "erp_customer_links"
    ADD CONSTRAINT "erp_customer_links_vendor_id_fkey"
    FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "erp_customer_links"
    ADD CONSTRAINT "erp_customer_links_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
