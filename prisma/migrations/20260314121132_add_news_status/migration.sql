-- AlterTable
ALTER TABLE "News" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published';

-- CreateIndex
CREATE INDEX "News_status_idx" ON "News"("status");

-- CreateIndex
CREATE INDEX "News_status_publishedAt_idx" ON "News"("status", "publishedAt");
