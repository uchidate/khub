-- AlterTable
ALTER TABLE "Production" ADD COLUMN "categoryId" TEXT;

-- AddForeignKey
ALTER TABLE "Production" ADD CONSTRAINT "Production_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Production_categoryId_idx" ON "Production"("categoryId");
