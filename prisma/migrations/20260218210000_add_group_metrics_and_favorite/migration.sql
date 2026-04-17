-- AlterTable: add trending metrics to MusicalGroup
ALTER TABLE "MusicalGroup" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MusicalGroup" ADD COLUMN IF NOT EXISTS "favoriteCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MusicalGroup" ADD COLUMN IF NOT EXISTS "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable: add groupId to Favorite
ALTER TABLE "Favorite" ADD COLUMN IF NOT EXISTS "groupId" TEXT;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MusicalGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_groupId_key" ON "Favorite"("userId", "groupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Favorite_groupId_idx" ON "Favorite"("groupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MusicalGroup_trendingScore_idx" ON "MusicalGroup"("trendingScore");
