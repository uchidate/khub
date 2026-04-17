-- AlterTable
ALTER TABLE "Artist" ADD COLUMN "translationStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "translatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Artist_translationStatus_idx" ON "Artist"("translationStatus");

-- CreateIndex
CREATE INDEX "Artist_translationStatus_createdAt_idx" ON "Artist"("translationStatus", "createdAt");

-- Atualizar artistas existentes que já têm bio em português como 'completed'
UPDATE "Artist"
SET "translationStatus" = 'completed',
    "translatedAt" = NOW()
WHERE "bio" IS NOT NULL
  AND LENGTH("bio") > 0;
