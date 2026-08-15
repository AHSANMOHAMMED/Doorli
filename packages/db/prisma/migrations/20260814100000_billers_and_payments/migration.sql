CREATE TABLE IF NOT EXISTS "billers" (
  "id" VARCHAR(50) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "type" VARCHAR(30) NOT NULL,
  "logo" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "billers_type_is_active_idx" ON "billers"("type", "is_active");

CREATE TABLE IF NOT EXISTS "bill_payments" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "biller_id" VARCHAR(50) NOT NULL,
  "account_ref" VARCHAR(150) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "type" VARCHAR(30) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "reference" VARCHAR(80) NOT NULL,
  "idempotency_key" VARCHAR(150) NOT NULL,
  "provider_ref" VARCHAR(150),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bill_payments_reference_key" ON "bill_payments"("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "bill_payments_user_id_idempotency_key_key" ON "bill_payments"("user_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "bill_payments_user_id_created_at_idx" ON "bill_payments"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "bill_payments_status_created_at_idx" ON "bill_payments"("status", "created_at");
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_biller_id_fkey" FOREIGN KEY ("biller_id") REFERENCES "billers"("id") ON UPDATE CASCADE;
