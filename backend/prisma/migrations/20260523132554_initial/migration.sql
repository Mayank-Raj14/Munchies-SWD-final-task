CREATE TYPE "Role" AS ENUM ('USER', 'STORE_OWNER', 'ADMIN');

CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

CREATE TYPE "StoreOwnershipRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoreOwnershipRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "status" "StoreOwnershipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreOwnershipRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "Hostel_name_key" ON "Hostel"("name");

CREATE INDEX "Store_ownerId_idx" ON "Store"("ownerId");

CREATE INDEX "Store_hostelId_idx" ON "Store"("hostelId");

CREATE UNIQUE INDEX "Store_hostelId_roomNumber_name_key" ON "Store"("hostelId", "roomNumber", "name");

CREATE INDEX "Item_storeId_idx" ON "Item"("storeId");

CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

CREATE INDEX "CartItem_itemId_idx" ON "CartItem"("itemId");

CREATE UNIQUE INDEX "CartItem_cartId_itemId_key" ON "CartItem"("cartId", "itemId");

CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

CREATE INDEX "Booking_storeId_idx" ON "Booking"("storeId");

CREATE INDEX "Booking_status_idx" ON "Booking"("status");

CREATE INDEX "BookingItem_bookingId_idx" ON "BookingItem"("bookingId");

CREATE INDEX "BookingItem_itemId_idx" ON "BookingItem"("itemId");

CREATE INDEX "StoreOwnershipRequest_userId_idx" ON "StoreOwnershipRequest"("userId");

CREATE INDEX "StoreOwnershipRequest_hostelId_idx" ON "StoreOwnershipRequest"("hostelId");

CREATE INDEX "StoreOwnershipRequest_status_idx" ON "StoreOwnershipRequest"("status");

CREATE INDEX "StoreOwnershipRequest_reviewedById_idx" ON "StoreOwnershipRequest"("reviewedById");

ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Store" ADD CONSTRAINT "Store_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Item" ADD CONSTRAINT "Item_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoreOwnershipRequest" ADD CONSTRAINT "StoreOwnershipRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoreOwnershipRequest" ADD CONSTRAINT "StoreOwnershipRequest_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoreOwnershipRequest" ADD CONSTRAINT "StoreOwnershipRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
