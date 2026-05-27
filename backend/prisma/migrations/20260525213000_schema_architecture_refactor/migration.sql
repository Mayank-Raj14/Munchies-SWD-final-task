-- Tighten marketplace history ownership.
ALTER TABLE "Store" DROP CONSTRAINT IF EXISTS "Store_ownerId_fkey";
ALTER TABLE "Store"
ADD CONSTRAINT "Store_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_userId_fkey";
ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Replace prototype-era single-column indexes with query-shaped composite indexes.
DROP INDEX IF EXISTS "User_role_idx";
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx" ON "User"("role", "createdAt");

DROP INDEX IF EXISTS "Store_ownerId_idx";
DROP INDEX IF EXISTS "Store_hostelId_idx";
CREATE INDEX IF NOT EXISTS "Store_ownerId_createdAt_idx" ON "Store"("ownerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Store_hostelId_createdAt_idx" ON "Store"("hostelId", "createdAt");
CREATE INDEX IF NOT EXISTS "Store_createdAt_idx" ON "Store"("createdAt");

DROP INDEX IF EXISTS "StoreOwnershipRequest_userId_idx";
DROP INDEX IF EXISTS "StoreOwnershipRequest_status_idx";
DROP INDEX IF EXISTS "StoreOwnershipRequest_reviewedById_idx";
CREATE INDEX IF NOT EXISTS "StoreOwnershipRequest_userId_createdAt_idx" ON "StoreOwnershipRequest"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "StoreOwnershipRequest_userId_status_createdAt_idx" ON "StoreOwnershipRequest"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "StoreOwnershipRequest_status_createdAt_idx" ON "StoreOwnershipRequest"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "StoreOwnershipRequest_status_hostelId_roomNumber_storeName_idx" ON "StoreOwnershipRequest"("status", "hostelId", "roomNumber", "storeName");
CREATE INDEX IF NOT EXISTS "StoreOwnershipRequest_reviewedById_reviewedAt_idx" ON "StoreOwnershipRequest"("reviewedById", "reviewedAt");

DROP INDEX IF EXISTS "Item_storeId_idx";
DROP INDEX IF EXISTS "Item_storeId_isAvailable_idx";
CREATE INDEX IF NOT EXISTS "Item_storeId_createdAt_idx" ON "Item"("storeId", "createdAt");
CREATE INDEX IF NOT EXISTS "Item_storeId_isAvailable_createdAt_idx" ON "Item"("storeId", "isAvailable", "createdAt");
CREATE INDEX IF NOT EXISTS "Item_storeId_isAvailable_stock_idx" ON "Item"("storeId", "isAvailable", "stock");
CREATE INDEX IF NOT EXISTS "Item_category_idx" ON "Item"("category");

DROP INDEX IF EXISTS "Cart_userId_idx";
DROP INDEX IF EXISTS "Cart_storeId_idx";
CREATE INDEX IF NOT EXISTS "Cart_userId_updatedAt_idx" ON "Cart"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Cart_storeId_updatedAt_idx" ON "Cart"("storeId", "updatedAt");

DROP INDEX IF EXISTS "CartItem_cartId_idx";
CREATE INDEX IF NOT EXISTS "CartItem_cartId_createdAt_idx" ON "CartItem"("cartId", "createdAt");

DROP INDEX IF EXISTS "Booking_userId_idx";
DROP INDEX IF EXISTS "Booking_storeId_idx";
DROP INDEX IF EXISTS "Booking_status_idx";
DROP INDEX IF EXISTS "Booking_cancellationReviewedById_idx";
CREATE INDEX IF NOT EXISTS "Booking_userId_createdAt_idx" ON "Booking"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Booking_storeId_createdAt_idx" ON "Booking"("storeId", "createdAt");
CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Booking_expiredWarningIssuedAt_idx" ON "Booking"("expiredWarningIssuedAt");
CREATE INDEX IF NOT EXISTS "Booking_cancellationReviewedById_cancellationReviewedAt_idx" ON "Booking"("cancellationReviewedById", "cancellationReviewedAt");
CREATE INDEX IF NOT EXISTS "Booking_status_inventoryRestoredAt_expiredWarningIssuedAt_e_idx" ON "Booking"("status", "inventoryRestoredAt", "expiredWarningIssuedAt", "expiresAt");

DROP INDEX IF EXISTS "BookingItem_bookingId_idx";
CREATE INDEX IF NOT EXISTS "BookingItem_bookingId_createdAt_idx" ON "BookingItem"("bookingId", "createdAt");

DROP INDEX IF EXISTS "Warning_userId_idx";
DROP INDEX IF EXISTS "Warning_storeId_idx";
DROP INDEX IF EXISTS "Warning_issuedById_idx";
DROP INDEX IF EXISTS "Warning_type_idx";
CREATE INDEX IF NOT EXISTS "Warning_userId_createdAt_idx" ON "Warning"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Warning_storeId_createdAt_idx" ON "Warning"("storeId", "createdAt");
CREATE INDEX IF NOT EXISTS "Warning_issuedById_createdAt_idx" ON "Warning"("issuedById", "createdAt");
CREATE INDEX IF NOT EXISTS "Warning_type_createdAt_idx" ON "Warning"("type", "createdAt");

DROP INDEX IF EXISTS "GlobalUserBlock_blockedById_idx";
CREATE INDEX IF NOT EXISTS "GlobalUserBlock_blockedById_createdAt_idx" ON "GlobalUserBlock"("blockedById", "createdAt");

DROP INDEX IF EXISTS "StoreUserBlock_userId_idx";
DROP INDEX IF EXISTS "StoreUserBlock_storeId_idx";
DROP INDEX IF EXISTS "StoreUserBlock_blockedById_idx";
CREATE INDEX IF NOT EXISTS "StoreUserBlock_storeId_createdAt_idx" ON "StoreUserBlock"("storeId", "createdAt");
CREATE INDEX IF NOT EXISTS "StoreUserBlock_blockedById_createdAt_idx" ON "StoreUserBlock"("blockedById", "createdAt");
