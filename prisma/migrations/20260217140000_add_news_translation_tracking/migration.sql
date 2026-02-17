-- AlterTable: Add translation tracking fields to News
ALTER TABLE "News"
  ADD COLUMN "translationStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "translatedAt"       TIMESTAMP(3),
  ADD COLUMN "originalTitle"      TEXT,
  ADD COLUMN "originalContent"    TEXT;

-- CreateIndex for efficient querying of pending/failed news
CREATE INDEX "News_translationStatus_idx" ON "News"("translationStatus");
CREATE INDEX "News_translationStatus_createdAt_idx" ON "News"("translationStatus", "createdAt");

-- Mark existing news as completed (already translated or is what it is)
UPDATE "News" SET "translationStatus" = 'completed', "translatedAt" = NOW();
