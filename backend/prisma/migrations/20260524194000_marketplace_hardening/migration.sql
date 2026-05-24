CREATE TYPE "WarningType" AS ENUM ('MANUAL', 'ORDER_EXPIRED');

ALTER TABLE "Item"
ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Booking"
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "inventoryRestoredAt" TIMESTAMP(3),
ADD COLUMN "cancellationReviewedById" TEXT,
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "expiredWarningIssuedAt" TIMESTAMP(3);

CREATE TABLE "Warning" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storeId" TEXT,
  "bookingId" TEXT,
  "issuedById" TEXT,
  "type" "WarningType" NOT NULL DEFAULT 'MANUAL',
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Warning_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalUserBlock" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "blockedById" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GlobalUserBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoreUserBlock" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "blockedById" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StoreUserBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Warning_bookingId_key" ON "Warning"("bookingId");
CREATE INDEX "Warning_userId_idx" ON "Warning"("userId");
CREATE INDEX "Warning_storeId_idx" ON "Warning"("storeId");
CREATE INDEX "Warning_issuedById_idx" ON "Warning"("issuedById");
CREATE INDEX "Warning_type_idx" ON "Warning"("type");

CREATE UNIQUE INDEX "GlobalUserBlock_userId_key" ON "GlobalUserBlock"("userId");
CREATE INDEX "GlobalUserBlock_blockedById_idx" ON "GlobalUserBlock"("blockedById");

CREATE UNIQUE INDEX "StoreUserBlock_userId_storeId_key" ON "StoreUserBlock"("userId", "storeId");
CREATE INDEX "StoreUserBlock_storeId_idx" ON "StoreUserBlock"("storeId");
CREATE INDEX "StoreUserBlock_blockedById_idx" ON "StoreUserBlock"("blockedById");

CREATE INDEX "Item_storeId_isAvailable_idx" ON "Item"("storeId", "isAvailable");
CREATE INDEX "Booking_expiresAt_idx" ON "Booking"("expiresAt");
CREATE INDEX "Booking_inventoryRestoredAt_idx" ON "Booking"("inventoryRestoredAt");
CREATE INDEX "Booking_cancellationReviewedById_idx" ON "Booking"("cancellationReviewedById");
CREATE INDEX "Booking_storeId_status_createdAt_idx" ON "Booking"("storeId", "status", "createdAt");
CREATE INDEX "Booking_userId_status_createdAt_idx" ON "Booking"("userId", "status", "createdAt");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_cancellationReviewedById_fkey" FOREIGN KEY ("cancellationReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GlobalUserBlock" ADD CONSTRAINT "GlobalUserBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GlobalUserBlock" ADD CONSTRAINT "GlobalUserBlock_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoreUserBlock" ADD CONSTRAINT "StoreUserBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreUserBlock" ADD CONSTRAINT "StoreUserBlock_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreUserBlock" ADD CONSTRAINT "StoreUserBlock_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
