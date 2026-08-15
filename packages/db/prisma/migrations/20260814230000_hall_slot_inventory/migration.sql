CREATE TABLE IF NOT EXISTS "hall_slots" (
  "id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "slot_type" VARCHAR(30) NOT NULL,
  "capacity" INTEGER NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "amenities" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hall_slots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "hall_slots_vendor_id_name_key" ON "hall_slots"("vendor_id", "name");
CREATE INDEX IF NOT EXISTS "hall_slots_vendor_id_is_active_idx" ON "hall_slots"("vendor_id", "is_active");
ALTER TABLE "hall_slots" ADD CONSTRAINT "hall_slots_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "hall_slot_id" UUID;
CREATE INDEX IF NOT EXISTS "bookings_hall_slot_id_event_date_idx" ON "bookings"("hall_slot_id", "event_date");
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hall_slot_id_fkey" FOREIGN KEY ("hall_slot_id") REFERENCES "hall_slots"("id") ON UPDATE CASCADE;
