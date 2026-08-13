ALTER TABLE "ride_requests"
  ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "vehicle_type" "VehicleType" NOT NULL DEFAULT 'car',
  ADD COLUMN IF NOT EXISTS "pickup_address" TEXT,
  ADD COLUMN IF NOT EXISTS "dropoff_address" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ride_requests_customer_id_idempotency_key_key"
  ON "ride_requests"("customer_id", "idempotency_key");
