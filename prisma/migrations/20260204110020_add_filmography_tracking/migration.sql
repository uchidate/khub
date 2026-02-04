-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "tmdbId" TEXT,
ADD COLUMN     "tmdbLastAttempt" TIMESTAMP(3),
ADD COLUMN     "tmdbLastSync" TIMESTAMP(3),
ADD COLUMN     "tmdbSyncStatus" TEXT;

-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "releaseDate" TIMESTAMP(3),
ADD COLUMN     "runtime" INTEGER,
ADD COLUMN     "tmdbId" TEXT,
ADD COLUMN     "tmdbType" TEXT,
ADD COLUMN     "voteAverage" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Artist_tmdbSyncStatus_idx" ON "Artist"("tmdbSyncStatus");

-- CreateIndex
CREATE INDEX "Artist_tmdbLastSync_idx" ON "Artist"("tmdbLastSync");

-- CreateIndex
CREATE INDEX "Production_tmdbId_idx" ON "Production"("tmdbId");

-- CreateIndex
CREATE INDEX "Production_releaseDate_idx" ON "Production"("releaseDate");
