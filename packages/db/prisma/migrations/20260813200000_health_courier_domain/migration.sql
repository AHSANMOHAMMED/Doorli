CREATE TABLE IF NOT EXISTS "health_providers" (
  "id" TEXT NOT NULL, "name" VARCHAR(120) NOT NULL, "type" VARCHAR(30) NOT NULL,
  "specialty" TEXT, "city" VARCHAR(80), "latitude" DECIMAL(10,8), "longitude" DECIMAL(11,8),
  "fee" DECIMAL(12,2) NOT NULL DEFAULT 0, "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "health_providers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "health_providers_type_is_active_idx" ON "health_providers"("type", "is_active");
CREATE TABLE IF NOT EXISTS "appointments" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "provider_id" TEXT NOT NULL, "slot_time" TIMESTAMP(3) NOT NULL,
  "type" VARCHAR(30) NOT NULL, "status" VARCHAR(20) NOT NULL DEFAULT 'confirmed', "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "appointments_pkey" PRIMARY KEY ("id"), CONSTRAINT "appointments_provider_id_slot_time_key" UNIQUE ("provider_id", "slot_time")
);
CREATE INDEX IF NOT EXISTS "appointments_user_id_slot_time_idx" ON "appointments"("user_id", "slot_time");
CREATE TABLE IF NOT EXISTS "lab_orders" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "provider_id" TEXT NOT NULL, "tests" JSONB NOT NULL,
  "collection_slot" TIMESTAMP(3) NOT NULL, "address" TEXT NOT NULL, "status" VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  "reference" VARCHAR(40) NOT NULL UNIQUE, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "lab_orders_user_id_created_at_idx" ON "lab_orders"("user_id", "created_at");
CREATE TABLE IF NOT EXISTS "medicine_orders" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "pharmacy_id" TEXT NOT NULL, "items" JSONB NOT NULL,
  "prescription_url" TEXT, "status" VARCHAR(20) NOT NULL DEFAULT 'pending', "reference" VARCHAR(40) NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "medicine_orders_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "nursing_bookings" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "visit_date" TIMESTAMP(3) NOT NULL, "duration_hours" INTEGER NOT NULL,
  "requirements" TEXT, "address" TEXT NOT NULL, "status" VARCHAR(20) NOT NULL DEFAULT 'confirmed', "reference" VARCHAR(40) NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "nursing_bookings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "class_bookings" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "provider_id" TEXT NOT NULL, "class_date" TIMESTAMP(3) NOT NULL,
  "class_name" TEXT NOT NULL, "max_participants" INTEGER NOT NULL, "status" VARCHAR(20) NOT NULL DEFAULT 'confirmed', "reference" VARCHAR(40) NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "class_bookings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "class_bookings_provider_id_class_date_idx" ON "class_bookings"("provider_id", "class_date");
CREATE TABLE IF NOT EXISTS "courier_jobs" (
  "id" UUID NOT NULL, "customer_id" UUID NOT NULL, "runner_id" UUID, "type" VARCHAR(30) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending', "pickup_address" TEXT NOT NULL, "pickup_latitude" DECIMAL(10,8), "pickup_longitude" DECIMAL(11,8),
  "dropoff_address" TEXT NOT NULL, "dropoff_latitude" DECIMAL(10,8), "dropoff_longitude" DECIMAL(11,8), "fare_estimate" DECIMAL(12,2),
  "proof_url" TEXT, "metadata" JSONB, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "courier_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "courier_jobs_customer_id_created_at_idx" ON "courier_jobs"("customer_id", "created_at");
CREATE INDEX IF NOT EXISTS "courier_jobs_status_created_at_idx" ON "courier_jobs"("status", "created_at");
