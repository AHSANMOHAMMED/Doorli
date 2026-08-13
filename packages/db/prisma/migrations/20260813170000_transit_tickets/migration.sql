CREATE TABLE IF NOT EXISTS "transit_tickets" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "route_id" VARCHAR(50) NOT NULL,
  "seat_number" VARCHAR(10) NOT NULL,
  "departure" TIMESTAMP(3) NOT NULL,
  "fare_amount" DECIMAL(10,2) NOT NULL,
  "booking_ref" VARCHAR(40) NOT NULL,
  "qr_payload" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transit_tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transit_tickets_booking_ref_key" UNIQUE ("booking_ref")
);
CREATE INDEX IF NOT EXISTS "transit_tickets_user_id_departure_idx" ON "transit_tickets"("user_id", "departure");
CREATE INDEX IF NOT EXISTS "transit_tickets_route_id_departure_seat_number_idx" ON "transit_tickets"("route_id", "departure", "seat_number");
ALTER TABLE "transit_tickets" ADD CONSTRAINT "transit_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
