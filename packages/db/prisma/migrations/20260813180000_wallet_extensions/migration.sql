CREATE TABLE IF NOT EXISTS "auto_topup_rules" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "threshold" DECIMAL(12,2) NOT NULL,
  "topup_amount" DECIMAL(12,2) NOT NULL,
  "method" VARCHAR(20) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "auto_topup_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "auto_topup_rules_user_id_is_active_idx" ON "auto_topup_rules"("user_id", "is_active");
ALTER TABLE "auto_topup_rules" ADD CONSTRAINT "auto_topup_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "wallet_payouts" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" VARCHAR(20) NOT NULL,
  "destination" VARCHAR(150),
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "reference" VARCHAR(100),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_payouts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "wallet_payouts_user_id_created_at_idx" ON "wallet_payouts"("user_id", "created_at");
ALTER TABLE "wallet_payouts" ADD CONSTRAINT "wallet_payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
