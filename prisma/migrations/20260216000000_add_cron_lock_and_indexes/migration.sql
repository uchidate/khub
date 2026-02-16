-- CreateTable
CREATE TABLE "cron_locks" (
    "id" TEXT NOT NULL DEFAULT 'cron-update',
    "lockedBy" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (composite for cron filmography queries)
CREATE INDEX "Artist_tmdbSyncStatus_tmdbLastSync_idx" ON "Artist"("tmdbSyncStatus", "tmdbLastSync");
