-- CreateTable
CREATE TABLE "streaming_trend_signal" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "showTitle" TEXT NOT NULL,
    "showTmdbId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaming_trend_signal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "streaming_trend_signal_artistId_idx" ON "streaming_trend_signal"("artistId");

-- CreateIndex
CREATE INDEX "streaming_trend_signal_expiresAt_idx" ON "streaming_trend_signal"("expiresAt");

-- CreateIndex
CREATE INDEX "streaming_trend_signal_source_idx" ON "streaming_trend_signal"("source");

-- CreateIndex
CREATE UNIQUE INDEX "streaming_trend_signal_artistId_showTmdbId_source_key" ON "streaming_trend_signal"("artistId", "showTmdbId", "source");

-- AddForeignKey
ALTER TABLE "streaming_trend_signal" ADD CONSTRAINT "streaming_trend_signal_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
