CREATE TABLE "integration_failures" (
    "id" UUID NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "dedupe_key" VARCHAR(255) NOT NULL,
    "vendor_id" UUID,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "last_error" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_failures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_failures_dedupe_key_key" ON "integration_failures"("dedupe_key");
CREATE INDEX "integration_failures_status_next_retry_at_idx" ON "integration_failures"("status", "next_retry_at");
CREATE INDEX "integration_failures_kind_created_at_idx" ON "integration_failures"("kind", "created_at");
ALTER TABLE "integration_failures" ADD CONSTRAINT "integration_failures_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
