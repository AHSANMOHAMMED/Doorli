ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(150);
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS "service_requests_customer_id_idempotency_key_key"
  ON "service_requests"("customer_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
