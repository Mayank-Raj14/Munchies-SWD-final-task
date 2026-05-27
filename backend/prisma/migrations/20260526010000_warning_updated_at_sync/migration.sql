ALTER TABLE "Warning" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "Warning"
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "updatedAt" IS NULL;

ALTER TABLE "Warning" ALTER COLUMN "updatedAt" SET NOT NULL;
