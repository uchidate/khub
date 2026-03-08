-- CreateIndex
CREATE INDEX "Artist_flaggedAsNonKorean_isHidden_trendingScore_idx" ON "Artist"("flaggedAsNonKorean", "isHidden", "trendingScore");

-- CreateIndex
CREATE INDEX "MusicalGroup_disbandDate_isHidden_trendingScore_idx" ON "MusicalGroup"("disbandDate", "isHidden", "trendingScore");

-- CreateIndex
CREATE INDEX "News_isHidden_publishedAt_idx" ON "News"("isHidden", "publishedAt");

-- CreateIndex
CREATE INDEX "Production_flaggedAsNonKorean_isHidden_idx" ON "Production"("flaggedAsNonKorean", "isHidden");
