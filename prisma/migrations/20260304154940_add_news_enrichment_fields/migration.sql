-- AlterTable
ALTER TABLE "News" ADD COLUMN     "author" TEXT,
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "readingTimeMin" INTEGER;

-- CreateIndex
CREATE INDEX "News_contentType_idx" ON "News"("contentType");
