/*
  Warnings:

  - A unique constraint covering the columns `[nameRomanized]` on the table `Artist` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `News` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[titlePt]` on the table `Production` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Artist_nameRomanized_key" ON "Artist"("nameRomanized");

-- CreateIndex
CREATE UNIQUE INDEX "News_title_key" ON "News"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Production_titlePt_key" ON "Production"("titlePt");
