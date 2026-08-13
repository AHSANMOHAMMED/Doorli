ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locality" VARCHAR(100);

CREATE TABLE IF NOT EXISTS "community_posts" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" VARCHAR(30) NOT NULL,
  "content" TEXT NOT NULL,
  "locality" VARCHAR(100) NOT NULL,
  "media_urls" JSONB NOT NULL DEFAULT '[]',
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "community_posts_locality_created_at_idx" ON "community_posts"("locality", "created_at");
CREATE INDEX IF NOT EXISTS "community_posts_user_id_created_at_idx" ON "community_posts"("user_id", "created_at");
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "interest_groups" (
  "id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "locality" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interest_groups_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "interest_groups_locality_idx" ON "interest_groups"("locality");

CREATE TABLE IF NOT EXISTS "group_memberships" (
  "id" UUID NOT NULL,
  "group_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "group_memberships_group_id_user_id_key" UNIQUE ("group_id", "user_id")
);
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "interest_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "moderation_flags" (
  "id" UUID NOT NULL,
  "post_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moderation_flags_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "moderation_flags_post_id_user_id_key" UNIQUE ("post_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "moderation_flags_post_id_created_at_idx" ON "moderation_flags"("post_id", "created_at");
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
