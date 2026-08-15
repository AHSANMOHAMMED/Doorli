CREATE TABLE IF NOT EXISTS "beauty_services" (
  "id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "duration_mins" INTEGER NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "beauty_services_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "beauty_services_vendor_id_name_key" ON "beauty_services"("vendor_id", "name");
CREATE INDEX IF NOT EXISTS "beauty_services_vendor_id_is_active_idx" ON "beauty_services"("vendor_id", "is_active");
ALTER TABLE "beauty_services" ADD CONSTRAINT "beauty_services_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "beauty_service_id" UUID;
CREATE INDEX IF NOT EXISTS "bookings_beauty_service_id_event_date_idx" ON "bookings"("beauty_service_id", "event_date");
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_beauty_service_id_fkey" FOREIGN KEY ("beauty_service_id") REFERENCES "beauty_services"("id") ON UPDATE CASCADE;
