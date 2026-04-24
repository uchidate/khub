ALTER TABLE "Production" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "Production_slug_key" ON "Production"("slug");
