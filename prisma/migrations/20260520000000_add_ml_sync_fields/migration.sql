-- AlterTable: add ML OAuth token fields to system_settings
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "mlAccessToken" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "mlRefreshToken" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "mlTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "mlUserId" TEXT;

-- AlterTable: add ML sync fields to StoreProduct
ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "StoreProduct_externalId_key" ON "StoreProduct"("externalId");
CREATE INDEX IF NOT EXISTS "StoreProduct_externalId_idx" ON "StoreProduct"("externalId");
