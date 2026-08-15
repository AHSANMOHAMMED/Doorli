CREATE TABLE IF NOT EXISTS "hotel_rooms" (
  "id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "room_type" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "capacity" INTEGER NOT NULL DEFAULT 2,
  "total_rooms" INTEGER NOT NULL DEFAULT 1,
  "price" DECIMAL(12,2) NOT NULL,
  "amenities" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hotel_rooms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "hotel_rooms_vendor_id_room_type_key" ON "hotel_rooms"("vendor_id", "room_type");
CREATE INDEX IF NOT EXISTS "hotel_rooms_vendor_id_is_active_idx" ON "hotel_rooms"("vendor_id", "is_active");
ALTER TABLE "hotel_rooms" ADD CONSTRAINT "hotel_rooms_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "room_id" UUID;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(150);
CREATE INDEX IF NOT EXISTS "bookings_room_id_check_in_date_check_out_date_idx" ON "bookings"("room_id", "check_in_date", "check_out_date");
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_customer_id_idempotency_key_key" ON "bookings"("customer_id", "idempotency_key");
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "hotel_rooms"("id") ON UPDATE CASCADE;
