CREATE TABLE "driver_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "driver_id" UUID NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "url" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "driver_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "driver_documents_driver_id_type_key" ON "driver_documents"("driver_id", "type");
CREATE INDEX "driver_documents_driver_id_idx" ON "driver_documents"("driver_id");
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_driver_id_fkey"
  FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD COLUMN "stripe_customer_id" VARCHAR(100);
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

CREATE TABLE "saved_payment_methods" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "stripe_payment_method_id" VARCHAR(100) NOT NULL,
  "stripe_customer_id" VARCHAR(100) NOT NULL,
  "brand" VARCHAR(30) NOT NULL,
  "last4" VARCHAR(4) NOT NULL,
  "exp_month" INTEGER NOT NULL,
  "exp_year" INTEGER NOT NULL,
  "cardholder_name" VARCHAR(100),
  "fingerprint" VARCHAR(100),
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "saved_payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_payment_methods_stripe_payment_method_id_key" ON "saved_payment_methods"("stripe_payment_method_id");
CREATE INDEX "saved_payment_methods_user_id_idx" ON "saved_payment_methods"("user_id");
CREATE INDEX "saved_payment_methods_user_id_is_default_idx" ON "saved_payment_methods"("user_id", "is_default");
ALTER TABLE "saved_payment_methods" ADD CONSTRAINT "saved_payment_methods_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
