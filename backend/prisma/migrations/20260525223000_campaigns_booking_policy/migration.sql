-- Campaigns, coupon usage, and stricter booking lifecycle support.

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CANCEL_REQUESTED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CampaignType') THEN
    CREATE TYPE "CampaignType" AS ENUM ('PERCENTAGE', 'FLAT');
  END IF;
END $$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "warningCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Booking"
ADD COLUMN IF NOT EXISTS "campaignId" TEXT,
ADD COLUMN IF NOT EXISTS "subtotalAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "collectedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "cancellationPreviousStatus" "BookingStatus";

UPDATE "Booking"
SET "subtotalAmount" = "totalAmount"
WHERE "subtotalAmount" = 0;

CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "CampaignType" NOT NULL,
  "value" DECIMAL(10, 2) NOT NULL,
  "minOrderValue" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "globalUsageLimit" INTEGER,
  "perUserUsageLimit" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CouponUsage" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Campaign_code_key" ON "Campaign"("code");
CREATE INDEX "Campaign_storeId_isActive_startsAt_endsAt_idx" ON "Campaign"("storeId", "isActive", "startsAt", "endsAt");
CREATE INDEX "Campaign_code_isActive_idx" ON "Campaign"("code", "isActive");
CREATE INDEX "Campaign_startsAt_endsAt_idx" ON "Campaign"("startsAt", "endsAt");

CREATE UNIQUE INDEX "CouponUsage_bookingId_key" ON "CouponUsage"("bookingId");
CREATE INDEX "CouponUsage_campaignId_usedAt_idx" ON "CouponUsage"("campaignId", "usedAt");
CREATE INDEX "CouponUsage_userId_usedAt_idx" ON "CouponUsage"("userId", "usedAt");
CREATE INDEX "CouponUsage_campaignId_userId_idx" ON "CouponUsage"("campaignId", "userId");

CREATE INDEX IF NOT EXISTS "User_warningCount_idx" ON "User"("warningCount");
CREATE INDEX IF NOT EXISTS "Booking_campaignId_idx" ON "Booking"("campaignId");
CREATE INDEX IF NOT EXISTS "Booking_collectedAt_idx" ON "Booking"("collectedAt");

ALTER TABLE "Campaign"
ADD CONSTRAINT "Campaign_storeId_fkey"
FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CouponUsage"
ADD CONSTRAINT "CouponUsage_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CouponUsage"
ADD CONSTRAINT "CouponUsage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponUsage"
ADD CONSTRAINT "CouponUsage_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
