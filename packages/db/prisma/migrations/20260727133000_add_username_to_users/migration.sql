-- Add username column for seeded user accounts and future logins.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
