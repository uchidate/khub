-- DropIndex
DROP INDEX "News_title_key";

-- CreateTable
CREATE TABLE "NewsArtist" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArtist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsArtist_newsId_idx" ON "NewsArtist"("newsId");

-- CreateIndex
CREATE INDEX "NewsArtist_artistId_idx" ON "NewsArtist"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArtist_newsId_artistId_key" ON "NewsArtist"("newsId", "artistId");

-- AddForeignKey
ALTER TABLE "NewsArtist" ADD CONSTRAINT "NewsArtist_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsArtist" ADD CONSTRAINT "NewsArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
