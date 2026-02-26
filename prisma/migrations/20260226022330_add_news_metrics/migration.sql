-- AlterTable
ALTER TABLE "News" ADD COLUMN     "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "News_trendingScore_idx" ON "News"("trendingScore");
