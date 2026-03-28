-- AlterTable: adiciona scheduledAt em BlogPost
ALTER TABLE "BlogPost" ADD COLUMN "scheduledAt" TIMESTAMP(3);

-- Index: status + scheduledAt (para o cron de publicação)
CREATE INDEX "BlogPost_status_scheduledAt_idx" ON "BlogPost"("status", "scheduledAt");

-- AlterTable: cria model SeoMeta
CREATE TABLE "seo_meta" (
    "id"           TEXT NOT NULL,
    "entityType"   TEXT NOT NULL,
    "entityId"     TEXT NOT NULL,
    "metaTitle"    VARCHAR(70),
    "metaDesc"     VARCHAR(160),
    "ogTitle"      VARCHAR(70),
    "ogDesc"       VARCHAR(200),
    "ogImageUrl"   TEXT,
    "canonicalUrl" TEXT,
    "noIndex"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seo_meta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seo_meta_entityType_entityId_key" ON "seo_meta"("entityType", "entityId");
CREATE INDEX "seo_meta_entityType_entityId_idx" ON "seo_meta"("entityType", "entityId");
