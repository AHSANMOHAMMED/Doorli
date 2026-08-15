CREATE TABLE IF NOT EXISTS "wallet_topup_intents" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" VARCHAR(20) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'requires_payment',
  "idempotency_key" VARCHAR(150) NOT NULL,
  "provider_transaction_id" VARCHAR(150),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wallet_topup_intents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_topup_intents_user_id_idempotency_key_key" ON "wallet_topup_intents"("user_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "wallet_topup_intents_status_created_at_idx" ON "wallet_topup_intents"("status", "created_at");
ALTER TABLE "wallet_topup_intents" ADD CONSTRAINT "wallet_topup_intents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
