-- CreateIndex
CREATE INDEX "Agency_createdAt_idx" ON "Agency"("createdAt");

-- CreateIndex
CREATE INDEX "Agency_name_idx" ON "Agency"("name");

-- CreateIndex
CREATE INDEX "Artist_agencyId_idx" ON "Artist"("agencyId");

-- CreateIndex
CREATE INDEX "Artist_createdAt_idx" ON "Artist"("createdAt");

-- CreateIndex
CREATE INDEX "Artist_birthDate_idx" ON "Artist"("birthDate");

-- CreateIndex
CREATE INDEX "Artist_nameRomanized_createdAt_idx" ON "Artist"("nameRomanized", "createdAt");

-- CreateIndex
CREATE INDEX "Image_entityType_entityId_idx" ON "Image"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Image_createdAt_idx" ON "Image"("createdAt");

-- CreateIndex
CREATE INDEX "News_publishedAt_idx" ON "News"("publishedAt");

-- CreateIndex
CREATE INDEX "News_createdAt_idx" ON "News"("createdAt");

-- CreateIndex
CREATE INDEX "News_title_idx" ON "News"("title");

-- CreateIndex
CREATE INDEX "Production_type_idx" ON "Production"("type");

-- CreateIndex
CREATE INDEX "Production_year_idx" ON "Production"("year");

-- CreateIndex
CREATE INDEX "Production_createdAt_idx" ON "Production"("createdAt");

-- CreateIndex
CREATE INDEX "Production_type_year_idx" ON "Production"("type", "year");

-- CreateIndex
CREATE INDEX "Production_titlePt_idx" ON "Production"("titlePt");

-- CreateIndex
CREATE INDEX "Tag_type_idx" ON "Tag"("type");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");
