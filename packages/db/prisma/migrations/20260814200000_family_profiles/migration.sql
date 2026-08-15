CREATE TABLE IF NOT EXISTS "family_profiles" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "relationship" VARCHAR(40) NOT NULL,
  "phone" VARCHAR(20),
  "date_of_birth" DATE,
  "preferences" JSONB,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "family_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "family_profiles_user_id_name_key" ON "family_profiles"("user_id", "name");
CREATE INDEX IF NOT EXISTS "family_profiles_user_id_is_default_idx" ON "family_profiles"("user_id", "is_default");
ALTER TABLE "family_profiles" ADD CONSTRAINT "family_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
