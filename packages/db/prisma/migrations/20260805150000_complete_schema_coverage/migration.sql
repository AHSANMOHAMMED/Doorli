-- Complete the database objects already represented by the Prisma schema but
-- missing from migration history. Keep this migration ordered so fresh and existing
-- deployments converge on the same schema.

ALTER TYPE "OrderType" ADD VALUE IF NOT EXISTS 'pos';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'cash';

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "corporate_id" UUID;


-- CreateTable
CREATE TABLE "product_aliases" (
    "id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "alias" VARCHAR(200) NOT NULL,
    "alias_key" VARCHAR(220) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_aliases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "forums" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "threads" (
    "id" UUID NOT NULL,
    "forum_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "parent_id" UUID,
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "forum_moderators" (
    "id" UUID NOT NULL,
    "forum_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "granted_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_moderators_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reputation_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "forum_bans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "forum_id" UUID,
    "reason" VARCHAR(200) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_bans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "location" GEOGRAPHY(POINT, 4326),
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'open',
    "media_urls" JSONB,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "emergency_alerts" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "geofence" GEOGRAPHY(POLYGON, 4326),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sos_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "location" GEOGRAPHY(POINT, 4326),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "recording_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "sos_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispatches" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "responder_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'assigned',
    "dispatched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrived_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "government_services" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tax_payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "tax_period" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "licenses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "license_no" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permits" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "permit_no" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "issued_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "category" VARCHAR(50) NOT NULL,
    "location" GEOGRAPHY(POINT, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_vaults" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_name" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_vaults_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public_consultations" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_consultations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consultation_comments" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_participants" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wishlist" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupOrder" (
    "id" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "vendorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupOrderItem" (
    "id" UUID NOT NULL,
    "groupOrderId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicket" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedTo" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketResponse" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CorporateAccount" (
    "id" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "addressLine" TEXT,
    "city" TEXT,
    "taxId" TEXT,
    "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditUsed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "approvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CorporateUser" (
    "id" UUID NOT NULL,
    "corporateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "department" TEXT,
    "monthlyLimit" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_aliases_vendor_id_idx" ON "product_aliases"("vendor_id");
CREATE INDEX "product_aliases_product_id_idx" ON "product_aliases"("product_id");
CREATE UNIQUE INDEX "product_aliases_vendor_id_alias_key_key" ON "product_aliases"("vendor_id", "alias_key");
CREATE INDEX "threads_forum_id_idx" ON "threads"("forum_id");
CREATE INDEX "threads_author_id_idx" ON "threads"("author_id");
CREATE INDEX "posts_thread_id_idx" ON "posts"("thread_id");
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");
CREATE INDEX "posts_parent_id_idx" ON "posts"("parent_id");
CREATE UNIQUE INDEX "forum_moderators_forum_id_user_id_key" ON "forum_moderators"("forum_id", "user_id");
CREATE INDEX "reputation_records_user_id_idx" ON "reputation_records"("user_id");
CREATE INDEX "forum_bans_user_id_idx" ON "forum_bans"("user_id");
CREATE INDEX "incidents_reporter_id_idx" ON "incidents"("reporter_id");
CREATE INDEX "incidents_status_idx" ON "incidents"("status");
CREATE INDEX "emergency_alerts_sender_id_idx" ON "emergency_alerts"("sender_id");
CREATE INDEX "sos_records_user_id_idx" ON "sos_records"("user_id");
CREATE INDEX "dispatches_incident_id_idx" ON "dispatches"("incident_id");
CREATE INDEX "dispatches_responder_id_idx" ON "dispatches"("responder_id");
CREATE INDEX "tax_payments_user_id_idx" ON "tax_payments"("user_id");
CREATE UNIQUE INDEX "licenses_license_no_key" ON "licenses"("license_no");
CREATE INDEX "licenses_user_id_idx" ON "licenses"("user_id");
CREATE UNIQUE INDEX "permits_permit_no_key" ON "permits"("permit_no");
CREATE INDEX "permits_user_id_idx" ON "permits"("user_id");
CREATE INDEX "complaints_user_id_idx" ON "complaints"("user_id");
CREATE INDEX "document_vaults_user_id_idx" ON "document_vaults"("user_id");
CREATE INDEX "consultation_comments_consultation_id_idx" ON "consultation_comments"("consultation_id");
CREATE INDEX "consultation_comments_user_id_idx" ON "consultation_comments"("user_id");
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");
CREATE INDEX "conversation_participants_conversation_id_idx" ON "conversation_participants"("conversation_id");
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");
CREATE INDEX "chat_messages_conversation_id_idx" ON "chat_messages"("conversation_id");
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");
CREATE INDEX "chat_messages_is_read_idx" ON "chat_messages"("is_read");
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages"("created_at");
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");
CREATE UNIQUE INDEX "Wishlist_userId_productId_key" ON "Wishlist"("userId", "productId");
CREATE UNIQUE INDEX "GroupOrder_inviteCode_key" ON "GroupOrder"("inviteCode");
CREATE INDEX "GroupOrder_inviteCode_idx" ON "GroupOrder"("inviteCode");
CREATE INDEX "GroupOrder_createdBy_idx" ON "GroupOrder"("createdBy");
CREATE INDEX "GroupOrderItem_groupOrderId_idx" ON "GroupOrderItem"("groupOrderId");
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX "TicketResponse_ticketId_idx" ON "TicketResponse"("ticketId");
CREATE UNIQUE INDEX "CorporateAccount_companyEmail_key" ON "CorporateAccount"("companyEmail");
CREATE INDEX "CorporateAccount_status_idx" ON "CorporateAccount"("status");
CREATE INDEX "CorporateUser_corporateId_idx" ON "CorporateUser"("corporateId");
CREATE UNIQUE INDEX "CorporateUser_corporateId_userId_key" ON "CorporateUser"("corporateId", "userId");

-- AddForeignKey
ALTER TABLE "product_aliases" ADD CONSTRAINT "product_aliases_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_aliases" ADD CONSTRAINT "product_aliases_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_corporate_id_fkey" FOREIGN KEY ("corporate_id") REFERENCES "CorporateAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "threads" ADD CONSTRAINT "threads_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "forums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "threads" ADD CONSTRAINT "threads_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "forum_moderators" ADD CONSTRAINT "forum_moderators_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "forums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_moderators" ADD CONSTRAINT "forum_moderators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "forum_moderators" ADD CONSTRAINT "forum_moderators_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reputation_records" ADD CONSTRAINT "reputation_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "forum_bans" ADD CONSTRAINT "forum_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sos_records" ADD CONSTRAINT "sos_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_responder_id_fkey" FOREIGN KEY ("responder_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tax_payments" ADD CONSTRAINT "tax_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tax_payments" ADD CONSTRAINT "tax_payments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "government_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "government_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "permits" ADD CONSTRAINT "permits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "permits" ADD CONSTRAINT "permits_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "government_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "government_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "document_vaults" ADD CONSTRAINT "document_vaults_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultation_comments" ADD CONSTRAINT "consultation_comments_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public_consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consultation_comments" ADD CONSTRAINT "consultation_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupOrder" ADD CONSTRAINT "GroupOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroupOrder" ADD CONSTRAINT "GroupOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroupOrderItem" ADD CONSTRAINT "GroupOrderItem_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "GroupOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupOrderItem" ADD CONSTRAINT "GroupOrderItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GroupOrderItem" ADD CONSTRAINT "GroupOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketResponse" ADD CONSTRAINT "TicketResponse_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketResponse" ADD CONSTRAINT "TicketResponse_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CorporateUser" ADD CONSTRAINT "CorporateUser_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CorporateUser" ADD CONSTRAINT "CorporateUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

