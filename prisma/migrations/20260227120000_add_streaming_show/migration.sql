-- CreateTable
CREATE TABLE "streaming_show" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "showTitle" TEXT NOT NULL,
    "tmdbId" TEXT NOT NULL,
    "posterUrl" TEXT,
    "year" INTEGER,
    "voteAverage" DOUBLE PRECISION,
    "isKorean" BOOLEAN NOT NULL DEFAULT false,
    "productionId" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaming_show_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "streaming_show_source_rank_idx" ON "streaming_show"("source", "rank");

-- CreateIndex
CREATE INDEX "streaming_show_expiresAt_idx" ON "streaming_show"("expiresAt");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "streaming_show_source_tmdbId_key" ON "streaming_show"("source", "tmdbId");

-- AddForeignKey
ALTER TABLE "streaming_show" ADD CONSTRAINT "streaming_show_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE SET NULL ON UPDATE CASCADE;
