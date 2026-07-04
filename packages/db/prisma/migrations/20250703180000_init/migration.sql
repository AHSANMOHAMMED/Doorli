-- CreateExtension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'vendor', 'driver', 'admin');
CREATE TYPE "VendorCategory" AS ENUM ('grocery', 'restaurant', 'hotel', 'hall', 'service', 'beauty');
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled');
CREATE TYPE "OrderType" AS ENUM ('delivery', 'pickup');
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'wallet', 'cod');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE "BookingType" AS ENUM ('hotel', 'hall', 'beauty', 'service');
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE "ServiceRequestStatus" AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "VehicleType" AS ENUM ('bike', 'car', 'van', 'truck');
CREATE TYPE "PaymentReferenceType" AS ENUM ('order', 'booking');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150),
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "profile_photo_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(50),
    "address_line" TEXT NOT NULL,
    "city" VARCHAR(80),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" VARCHAR(150) NOT NULL,
    "category" "VendorCategory" NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "phone" VARCHAR(20),
    "address_line" TEXT,
    "city" VARCHAR(80),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "opening_hours" JSONB,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "delivery_radius_km" INTEGER NOT NULL DEFAULT 5,
    "min_order_amount" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "price" DECIMAL(10,2) NOT NULL,
    "discount_price" DECIMAL(10,2),
    "unit" VARCHAR(50),
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "driver_id" UUID,
    "delivery_address_id" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "order_type" "OrderType" NOT NULL DEFAULT 'delivery',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'cod',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "estimated_delivery_time" INTEGER,
    "special_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "booking_number" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "booking_type" "BookingType" NOT NULL,
    "check_in_date" DATE,
    "check_out_date" DATE,
    "event_date" DATE,
    "start_time" TIME,
    "end_time" TIME,
    "guest_count" INTEGER,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "deposit_amount" DECIMAL(10,2),
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "requirements" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_requests" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "assigned_provider_id" UUID,
    "service_type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "address_line" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "offered_rate" DECIMAL(10,2),
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'open',
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "vehicle_number" VARCHAR(20),
    "license_number" VARCHAR(50),
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "current_latitude" DECIMAL(10,8),
    "current_longitude" DECIMAL(11,8),
    "last_location_update" TIMESTAMP(3),
    "total_deliveries" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "earnings_today" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "photos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "reference_id" UUID NOT NULL,
    "reference_type" "PaymentReferenceType" NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'LKR',
    "method" "PaymentMethod" NOT NULL,
    "gateway" VARCHAR(50),
    "gateway_transaction_id" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_created_at_idx" ON "users"("created_at");
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");
CREATE UNIQUE INDEX "vendors_user_id_key" ON "vendors"("user_id");
CREATE INDEX "vendors_category_idx" ON "vendors"("category");
CREATE INDEX "vendors_latitude_longitude_idx" ON "vendors"("latitude", "longitude");
CREATE INDEX "vendors_is_open_is_verified_idx" ON "vendors"("is_open", "is_verified");
CREATE INDEX "products_vendor_id_idx" ON "products"("vendor_id");
CREATE INDEX "products_is_available_idx" ON "products"("is_available");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");
CREATE INDEX "orders_vendor_id_idx" ON "orders"("vendor_id");
CREATE INDEX "orders_driver_id_idx" ON "orders"("driver_id");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE UNIQUE INDEX "bookings_booking_number_key" ON "bookings"("booking_number");
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");
CREATE INDEX "bookings_vendor_id_idx" ON "bookings"("vendor_id");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "service_requests_customer_id_idx" ON "service_requests"("customer_id");
CREATE INDEX "service_requests_assigned_provider_id_idx" ON "service_requests"("assigned_provider_id");
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");
CREATE INDEX "service_requests_service_type_idx" ON "service_requests"("service_type");
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers"("user_id");
CREATE INDEX "drivers_is_online_idx" ON "drivers"("is_online");
CREATE INDEX "drivers_current_latitude_current_longitude_idx" ON "drivers"("current_latitude", "current_longitude");
CREATE INDEX "reviews_vendor_id_idx" ON "reviews"("vendor_id");
CREATE INDEX "reviews_reviewer_id_idx" ON "reviews"("reviewer_id");
CREATE INDEX "payments_reference_id_reference_type_idx" ON "payments"("reference_id", "reference_type");
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assigned_provider_id_fkey" FOREIGN KEY ("assigned_provider_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
