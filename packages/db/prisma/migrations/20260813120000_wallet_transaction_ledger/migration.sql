CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(150) NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'LKR',
    "reference" VARCHAR(150),
    "description" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wallet_transactions_user_id_idempotency_key_key"
  ON "wallet_transactions"("user_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "wallet_transactions_user_id_created_at_idx"
  ON "wallet_transactions"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "wallet_transactions_wallet_id_created_at_idx"
  ON "wallet_transactions"("wallet_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey"
    FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
