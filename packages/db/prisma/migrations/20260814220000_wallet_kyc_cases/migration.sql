CREATE TABLE IF NOT EXISTS "kyc_cases" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "id_number_hash" VARCHAR(128),
  "document_url" TEXT,
  "rejection_reason" TEXT,
  "reviewed_by" UUID,
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "kyc_cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_cases_user_id_key" ON "kyc_cases"("user_id");
CREATE INDEX IF NOT EXISTS "kyc_cases_status_level_idx" ON "kyc_cases"("status", "level");
ALTER TABLE "kyc_cases" ADD CONSTRAINT "kyc_cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
