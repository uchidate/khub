-- AlterTable
ALTER TABLE "Agency" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");
