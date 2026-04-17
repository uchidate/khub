-- CreateTable
CREATE TABLE "bot_crawl_log" (
    "id" TEXT NOT NULL,
    "bot" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT NOT NULL,
    "referer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_crawl_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bot_crawl_log_createdAt_idx" ON "bot_crawl_log"("createdAt");

-- CreateIndex
CREATE INDEX "bot_crawl_log_bot_idx" ON "bot_crawl_log"("bot");

-- CreateIndex
CREATE INDEX "bot_crawl_log_path_idx" ON "bot_crawl_log"("path");

-- CreateIndex
CREATE INDEX "bot_crawl_log_bot_createdAt_idx" ON "bot_crawl_log"("bot", "createdAt");
