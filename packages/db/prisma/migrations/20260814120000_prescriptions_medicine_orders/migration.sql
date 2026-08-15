CREATE TABLE IF NOT EXISTS "prescriptions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "file_url" TEXT NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending_review',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "prescriptions_user_id_created_at_idx" ON "prescriptions"("user_id", "created_at");
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "medicine_orders" ADD COLUMN IF NOT EXISTS "prescription_id" UUID;
ALTER TABLE "medicine_orders" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(150);
ALTER TABLE "medicine_orders" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "medicine_orders" SET "idempotency_key" = gen_random_uuid()::text WHERE "idempotency_key" IS NULL;
ALTER TABLE "medicine_orders" ALTER COLUMN "idempotency_key" SET NOT NULL;
ALTER TABLE "medicine_orders" ALTER COLUMN "status" TYPE VARCHAR(30);
CREATE UNIQUE INDEX IF NOT EXISTS "medicine_orders_user_id_idempotency_key_key" ON "medicine_orders"("user_id", "idempotency_key");
ALTER TABLE "medicine_orders" ADD CONSTRAINT "medicine_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medicine_orders" ADD CONSTRAINT "medicine_orders_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON UPDATE CASCADE;
