CREATE TABLE IF NOT EXISTS "ai_sessions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "message" TEXT NOT NULL,
  "action_plan" JSONB NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'planned',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_sessions_user_id_created_at_idx" ON "ai_sessions"("user_id", "created_at");
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ai_action_logs" (
  "id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "module" VARCHAR(40) NOT NULL,
  "params" JSONB NOT NULL,
  "result" JSONB,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_action_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_action_logs_session_id_created_at_idx" ON "ai_action_logs"("session_id", "created_at");
ALTER TABLE "ai_action_logs" ADD CONSTRAINT "ai_action_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
