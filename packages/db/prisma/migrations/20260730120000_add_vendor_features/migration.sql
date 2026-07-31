-- Vendor feature flags: per-vendor platform feature toggles (idempotent)
-- Backs Standalone ERP Mode (Req 11) and Super Admin feature panel (Req 18).

CREATE TABLE IF NOT EXISTS "feature_flags" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_key_key" ON "feature_flags"("key");

CREATE TABLE IF NOT EXISTS "vendor_features" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "feature_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_features_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vendor_features_vendor_id_feature_id_key" ON "vendor_features"("vendor_id", "feature_id");
CREATE INDEX IF NOT EXISTS "vendor_features_vendor_id_idx" ON "vendor_features"("vendor_id");
CREATE INDEX IF NOT EXISTS "vendor_features_feature_id_idx" ON "vendor_features"("feature_id");

DO $$ BEGIN
  ALTER TABLE "vendor_features"
    ADD CONSTRAINT "vendor_features_vendor_id_fkey"
    FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "vendor_features"
    ADD CONSTRAINT "vendor_features_feature_id_fkey"
    FOREIGN KEY ("feature_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Canonical platform flags. Global flags are on for every vendor unless an
-- explicit VendorFeature row disables them; non-global flags are opt-in.
INSERT INTO "feature_flags" ("id", "key", "name", "description", "is_global", "updated_at")
VALUES
  (gen_random_uuid(), 'marketplace_listing', 'Marketplace Listing', 'Vendor is discoverable in customer-facing search, nearby and category results.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'doorli_delivery', 'Doorli Delivery', 'Orders and ERP sales can be dispatched through the Doorli driver network.', true, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'online_payment', 'Online Payment', 'Vendor can accept online card / wallet payments through Doorli.', false, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'pos', 'Point of Sale', 'Embedded ERP cashier (POS) available in the vendor console.', true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
