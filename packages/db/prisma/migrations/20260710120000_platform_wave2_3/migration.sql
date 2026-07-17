-- Wave 2-3 platform features (idempotent / safe for DBs that only have init)

-- Missing enums from later schema
DO $$ BEGIN
  CREATE TYPE "RideStatus" AS ENUM ('searching', 'assigned', 'arrived', 'in_transit', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables that exist in Prisma schema but were never in init
CREATE TABLE IF NOT EXISTS "loyalty_points" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "earned" INTEGER NOT NULL DEFAULT 0,
    "redeemed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loyalty_points_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_points_user_id_key" ON "loyalty_points"("user_id");
CREATE INDEX IF NOT EXISTS "loyalty_points_user_id_idx" ON "loyalty_points"("user_id");
DO $$ BEGIN
  ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ride_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "driver_id" UUID,
    "pickup_lat" DECIMAL(10,8) NOT NULL,
    "pickup_lng" DECIMAL(11,8) NOT NULL,
    "dropoff_lat" DECIMAL(10,8) NOT NULL,
    "dropoff_lng" DECIMAL(11,8) NOT NULL,
    "status" "RideStatus" NOT NULL DEFAULT 'searching',
    "base_fare" DECIMAL(10,2) NOT NULL,
    "return_premium" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_fare" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ride_requests_customer_id_idx" ON "ride_requests"("customer_id");
CREATE INDEX IF NOT EXISTS "ride_requests_driver_id_idx" ON "ride_requests"("driver_id");
CREATE INDEX IF NOT EXISTS "ride_requests_status_idx" ON "ride_requests"("status");
DO $$ BEGIN
  ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ride_requests" ADD CONSTRAINT "ride_requests_driver_id_fkey"
    FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "geographic_zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "city" VARCHAR(80),
    "demand_level" INTEGER NOT NULL DEFAULT 1,
    "boundaries" GEOGRAPHY(POLYGON, 4326),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "geographic_zones_pkey" PRIMARY KEY ("id")
);

-- Columns added after init (IF NOT EXISTS is Postgres 9.1+ for ADD COLUMN)
ALTER TABLE "geographic_zones" ADD COLUMN IF NOT EXISTS "city" VARCHAR(80);
ALTER TABLE "geographic_zones" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "prep_time_mins" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "addons" JSONB;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allergens" JSONB;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "duration_mins" INTEGER;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "room_type" VARCHAR(100);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "amenities" JSONB;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "contract_url" TEXT;

ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "erp_tenant_id" VARCHAR(50);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "erp_order_id" VARCHAR(50);

-- Drivers PostGIS location column (optional; used by ride-hailing)
DO $$ BEGIN
  ALTER TABLE "drivers" ADD COLUMN "location" GEOGRAPHY(POINT, 4326);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(40) NOT NULL,
    "description" TEXT,
    "discount_type" VARCHAR(20) NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_order_amount" DECIMAL(10,2),
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "vendor_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_key" ON "promo_codes"("code");
CREATE INDEX IF NOT EXISTS "promo_codes_is_active_idx" ON "promo_codes"("is_active");

CREATE TABLE IF NOT EXISTS "flash_sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "product_id" UUID,
    "title" VARCHAR(150) NOT NULL,
    "discount_pct" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flash_sales_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "flash_sales_vendor_id_is_active_idx" ON "flash_sales"("vendor_id", "is_active");

CREATE TABLE IF NOT EXISTS "event_packages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "event_date" DATE NOT NULL,
    "guest_count" INTEGER,
    "venue_vendor_id" UUID,
    "status" VARCHAR(40) NOT NULL DEFAULT 'draft',
    "total_estimate" DECIMAL(12,2),
    "items" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_packages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "event_packages_customer_id_idx" ON "event_packages"("customer_id");

CREATE TABLE IF NOT EXISTS "delivery_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "frequency" VARCHAR(20) NOT NULL,
    "next_delivery_at" TIMESTAMP(3) NOT NULL,
    "items" JSONB NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "delivery_subscriptions_customer_id_is_active_idx" ON "delivery_subscriptions"("customer_id", "is_active");
CREATE INDEX IF NOT EXISTS "delivery_subscriptions_next_delivery_at_idx" ON "delivery_subscriptions"("next_delivery_at");

CREATE TABLE IF NOT EXISTS "device_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "device_tokens_token_key" ON "device_tokens"("token");
CREATE INDEX IF NOT EXISTS "device_tokens_user_id_idx" ON "device_tokens"("user_id");
DO $$ BEGIN
  ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
