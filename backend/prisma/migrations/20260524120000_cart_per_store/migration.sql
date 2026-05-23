ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "storeId" TEXT;

UPDATE "Cart" c
SET "storeId" = (
  SELECT i."storeId"
  FROM "CartItem" ci
  INNER JOIN "Item" i ON i."id" = ci."itemId"
  WHERE ci."cartId" = c."id"
  LIMIT 1
)
WHERE c."storeId" IS NULL;

DELETE FROM "Cart" WHERE "storeId" IS NULL;

DROP INDEX IF EXISTS "Cart_userId_key";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Cart'
      AND column_name = 'storeId'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Cart" ALTER COLUMN "storeId" SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Cart_storeId_fkey'
  ) THEN
    ALTER TABLE "Cart"
    ADD CONSTRAINT "Cart_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Cart_storeId_idx" ON "Cart"("storeId");

CREATE UNIQUE INDEX IF NOT EXISTS "Cart_userId_storeId_key" ON "Cart"("userId", "storeId");
