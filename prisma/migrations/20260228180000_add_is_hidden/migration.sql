-- AddColumn: isHidden to Artist, Production, MusicalGroup
-- Allows admins to hide items from public listing without deleting them

ALTER TABLE "Artist" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Production" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MusicalGroup" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Artist_isHidden_idx" ON "Artist"("isHidden");
CREATE INDEX "Production_isHidden_idx" ON "Production"("isHidden");
CREATE INDEX "MusicalGroup_isHidden_idx" ON "MusicalGroup"("isHidden");
