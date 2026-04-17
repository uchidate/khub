-- Migration: agency_enrich
-- Adiciona campos editoriais às agências

ALTER TABLE "Agency"
  ADD COLUMN "logoUrl"      TEXT,
  ADD COLUMN "description"  TEXT,
  ADD COLUMN "foundedYear"  INTEGER,
  ADD COLUMN "country"      TEXT NOT NULL DEFAULT 'KR',
  ADD COLUMN "ceoName"      TEXT,
  ADD COLUMN "isVerified"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "accentColor"  TEXT,
  ADD COLUMN "type"         TEXT NOT NULL DEFAULT 'INDIE',
  ADD COLUMN "parentId"     TEXT;

-- Self-relation: subsidiary → parent
ALTER TABLE "Agency"
  ADD CONSTRAINT "Agency_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Agency"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Agency_isVerified_idx" ON "Agency"("isVerified");
CREATE INDEX "Agency_parentId_idx"   ON "Agency"("parentId");
