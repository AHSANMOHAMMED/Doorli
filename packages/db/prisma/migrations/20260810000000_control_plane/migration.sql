-- Centralized super-admin control plane
-- Persists maintenance, rate-limit policies, service on/off state, and the
-- audit log for every super-admin control action.

CREATE TABLE IF NOT EXISTS "maintenance_windows" (
    "id" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "reason" TEXT,
    "scope" VARCHAR(50) NOT NULL DEFAULT 'all',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_by" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_windows_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "maintenance_windows_active_idx" ON "maintenance_windows"("active");

CREATE TABLE IF NOT EXISTS "rate_limit_policies" (
    "id" UUID NOT NULL,
    "path" VARCHAR(200) NOT NULL,
    "window_ms" INTEGER NOT NULL DEFAULT 900000,
    "limit" INTEGER NOT NULL DEFAULT 500,
    "notes" VARCHAR(300),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "rate_limit_policies_path_key" ON "rate_limit_policies"("path");

CREATE TABLE IF NOT EXISTS "service_states" (
    "key" VARCHAR(50) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" VARCHAR(300),
    "updated_by" VARCHAR(100),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_states_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "control_audit" (
    "id" UUID NOT NULL,
    "actor" VARCHAR(100) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50),
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" VARCHAR(100),
    "summary" VARCHAR(500) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "control_audit_category_idx" ON "control_audit"("category");
CREATE INDEX IF NOT EXISTS "control_audit_created_at_idx" ON "control_audit"("created_at");
