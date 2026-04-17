-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('WANT_TO_WATCH', 'WATCHING', 'WATCHED', 'DROPPED');

-- CreateTable
CREATE TABLE "watch_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "status" "WatchStatus" NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,
    "watchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watch_entries_userId_idx" ON "watch_entries"("userId");

-- CreateIndex
CREATE INDEX "watch_entries_productionId_idx" ON "watch_entries"("productionId");

-- CreateIndex
CREATE INDEX "watch_entries_userId_status_idx" ON "watch_entries"("userId", "status");

-- CreateIndex
CREATE INDEX "watch_entries_userId_createdAt_idx" ON "watch_entries"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "watch_entries_userId_productionId_key" ON "watch_entries"("userId", "productionId");

-- AddForeignKey
ALTER TABLE "watch_entries" ADD CONSTRAINT "watch_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_entries" ADD CONSTRAINT "watch_entries_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE CASCADE ON UPDATE CASCADE;
