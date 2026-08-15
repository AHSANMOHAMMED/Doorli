ALTER TABLE "event_packages" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(150);
CREATE UNIQUE INDEX IF NOT EXISTS "event_packages_customer_id_idempotency_key_key"
  ON "event_packages"("customer_id", "idempotency_key");
