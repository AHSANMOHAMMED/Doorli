CREATE TABLE IF NOT EXISTS "premium_subscriptions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "tier" VARCHAR(20) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "next_renewal_at" TIMESTAMP(3) NOT NULL,
  "cancel_at" TIMESTAMP(3),
  "total_savings" DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT "premium_subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "premium_subscriptions_user_id_key" UNIQUE ("user_id")
);
CREATE INDEX IF NOT EXISTS "premium_subscriptions_status_next_renewal_at_idx" ON "premium_subscriptions"("status", "next_renewal_at");
ALTER TABLE "premium_subscriptions" ADD CONSTRAINT "premium_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
