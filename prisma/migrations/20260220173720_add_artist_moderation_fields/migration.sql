-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "flaggedAsNonKorean" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "placeOfBirth" TEXT;

-- CreateIndex
CREATE INDEX "Artist_flaggedAsNonKorean_idx" ON "Artist"("flaggedAsNonKorean");
