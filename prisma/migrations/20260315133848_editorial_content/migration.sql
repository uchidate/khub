-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "analiseEditorial" TEXT,
ADD COLUMN     "curiosidades" TEXT[],
ADD COLUMN     "editorialGeneratedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MusicalGroup" ADD COLUMN     "analiseEditorial" TEXT,
ADD COLUMN     "curiosidades" TEXT[],
ADD COLUMN     "editorialGeneratedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "editorialNote" TEXT,
ADD COLUMN     "editorialNoteGeneratedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "editorialGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "editorialRating" DOUBLE PRECISION,
ADD COLUMN     "editorialReview" TEXT,
ADD COLUMN     "whyWatch" TEXT;

-- CreateTable
CREATE TABLE "BlogPostArtist" (
    "blogPostId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,

    CONSTRAINT "BlogPostArtist_pkey" PRIMARY KEY ("blogPostId","artistId")
);

-- CreateTable
CREATE TABLE "BlogPostGroup" (
    "blogPostId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "BlogPostGroup_pkey" PRIMARY KEY ("blogPostId","groupId")
);

-- CreateTable
CREATE TABLE "BlogPostProduction" (
    "blogPostId" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,

    CONSTRAINT "BlogPostProduction_pkey" PRIMARY KEY ("blogPostId","productionId")
);

-- CreateIndex
CREATE INDEX "BlogPostArtist_artistId_idx" ON "BlogPostArtist"("artistId");

-- CreateIndex
CREATE INDEX "BlogPostGroup_groupId_idx" ON "BlogPostGroup"("groupId");

-- CreateIndex
CREATE INDEX "BlogPostProduction_productionId_idx" ON "BlogPostProduction"("productionId");

-- AddForeignKey
ALTER TABLE "BlogPostArtist" ADD CONSTRAINT "BlogPostArtist_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostArtist" ADD CONSTRAINT "BlogPostArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostGroup" ADD CONSTRAINT "BlogPostGroup_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostGroup" ADD CONSTRAINT "BlogPostGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MusicalGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostProduction" ADD CONSTRAINT "BlogPostProduction_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostProduction" ADD CONSTRAINT "BlogPostProduction_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE CASCADE ON UPDATE CASCADE;
