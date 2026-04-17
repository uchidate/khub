-- AlterTable
ALTER TABLE "News" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "News_isHidden_idx" ON "News"("isHidden");
