-- CreateTable
CREATE TABLE "server_log" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(2000) NOT NULL,
    "status" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "error" TEXT,
    "body" TEXT,
    "userAgent" VARCHAR(500),
    "ip" VARCHAR(45),

    CONSTRAINT "server_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "server_log_createdAt_idx" ON "server_log"("createdAt");

-- CreateIndex
CREATE INDEX "server_log_status_idx" ON "server_log"("status");

-- CreateIndex
CREATE INDEX "server_log_path_idx" ON "server_log"("path");
