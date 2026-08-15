ALTER TABLE "wallet_payouts" ADD COLUMN IF NOT EXISTS "provider_reference" VARCHAR(150);
ALTER TABLE "wallet_payouts" ADD COLUMN IF NOT EXISTS "failure_reason" TEXT;
ALTER TABLE "wallet_payouts" ADD COLUMN IF NOT EXISTS "processed_at" TIMESTAMP(3);
ALTER TABLE "wallet_payouts" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(150);
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_payouts_user_id_idempotency_key_key" ON "wallet_payouts"("user_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "wallet_payouts_status_created_at_idx" ON "wallet_payouts"("status", "created_at");
