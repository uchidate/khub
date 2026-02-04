-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "favoriteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastTrendingUpdate" TIMESTAMP(3),
ADD COLUMN     "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Artist_trendingScore_idx" ON "Artist"("trendingScore");
