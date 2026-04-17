-- CreateTable
CREATE TABLE "artist_discovery_log" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "wasAdded" BOOLEAN NOT NULL DEFAULT false,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,

    CONSTRAINT "artist_discovery_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "artist_discovery_log_tmdbId_idx" ON "artist_discovery_log"("tmdbId");

-- CreateIndex
CREATE INDEX "artist_discovery_log_attemptedAt_idx" ON "artist_discovery_log"("attemptedAt");

-- CreateIndex
CREATE INDEX "artist_discovery_log_tmdbId_attemptedAt_idx" ON "artist_discovery_log"("tmdbId", "attemptedAt");
