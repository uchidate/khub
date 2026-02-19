-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "instagramFeedUrl" TEXT,
ADD COLUMN     "instagramLastSync" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MusicalGroup" ADD COLUMN     "instagramFeedUrl" TEXT,
ADD COLUMN     "instagramLastSync" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "artistId" TEXT,
    "groupId" TEXT,
    "imageUrl" TEXT,
    "caption" TEXT,
    "permalink" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramPost_postId_key" ON "InstagramPost"("postId");

-- CreateIndex
CREATE INDEX "InstagramPost_artistId_postedAt_idx" ON "InstagramPost"("artistId", "postedAt");

-- CreateIndex
CREATE INDEX "InstagramPost_groupId_postedAt_idx" ON "InstagramPost"("groupId", "postedAt");

-- CreateIndex
CREATE INDEX "InstagramPost_postedAt_idx" ON "InstagramPost"("postedAt");

-- AddForeignKey
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MusicalGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
