CREATE TABLE IF NOT EXISTS "wallet_journal_entries" (
  "id" UUID NOT NULL,
  "transaction_id" UUID NOT NULL,
  "user_id" UUID,
  "account_ref" VARCHAR(150) NOT NULL,
  "account_type" VARCHAR(30) NOT NULL,
  "direction" VARCHAR(10) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'LKR',
  "balance_before" DECIMAL(12,2) NOT NULL,
  "balance_after" DECIMAL(12,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_journal_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "wallet_journal_entries_transaction_id_idx" ON "wallet_journal_entries"("transaction_id");
CREATE INDEX IF NOT EXISTS "wallet_journal_entries_account_type_account_ref_created_at_idx" ON "wallet_journal_entries"("account_type", "account_ref", "created_at");
ALTER TABLE "wallet_journal_entries" ADD CONSTRAINT "wallet_journal_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_journal_entries" ADD CONSTRAINT "wallet_journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
