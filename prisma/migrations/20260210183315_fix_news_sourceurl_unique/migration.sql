-- AlterTable: Remove unique constraint from News.title
ALTER TABLE "News" DROP CONSTRAINT IF EXISTS "News_title_key";

-- CreateIndex: Add unique constraint to News.sourceUrl
CREATE UNIQUE INDEX IF NOT EXISTS "News_sourceUrl_key" ON "News"("sourceUrl");

-- CreateIndex: Add index to News.sourceUrl for performance
CREATE INDEX IF NOT EXISTS "News_sourceUrl_idx" ON "News"("sourceUrl");
