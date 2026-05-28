ALTER TABLE "StoreAffiliateClick"
    ADD COLUMN "entityType" TEXT,
    ADD COLUMN "entityId" TEXT,
    ADD COLUMN "pagePath" TEXT,
    ADD COLUMN "position" INTEGER,
    ADD COLUMN "sessionId" TEXT;

CREATE INDEX "StoreAffiliateClick_entityType_entityId_createdAt_idx" ON "StoreAffiliateClick"("entityType", "entityId", "createdAt");
CREATE INDEX "StoreAffiliateClick_sessionId_createdAt_idx" ON "StoreAffiliateClick"("sessionId", "createdAt");

CREATE TABLE "StoreProductImpression" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "pagePath" TEXT,
    "position" INTEGER,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreProductImpression_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoreProductImpression_productId_createdAt_idx" ON "StoreProductImpression"("productId", "createdAt");
CREATE INDEX "StoreProductImpression_placement_createdAt_idx" ON "StoreProductImpression"("placement", "createdAt");
CREATE INDEX "StoreProductImpression_entityType_entityId_createdAt_idx" ON "StoreProductImpression"("entityType", "entityId", "createdAt");
CREATE INDEX "StoreProductImpression_sessionId_createdAt_idx" ON "StoreProductImpression"("sessionId", "createdAt");
CREATE INDEX "StoreProductImpression_createdAt_idx" ON "StoreProductImpression"("createdAt");

ALTER TABLE "StoreProductImpression" ADD CONSTRAINT "StoreProductImpression_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StoreProductCandidate" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchReasons" JSONB NOT NULL DEFAULT '[]',
    "riskFlags" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "source" TEXT NOT NULL DEFAULT 'auto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreProductCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoreProductCandidate_productId_entityType_entityId_key" ON "StoreProductCandidate"("productId", "entityType", "entityId");
CREATE INDEX "StoreProductCandidate_entityType_entityId_status_matchScore_idx" ON "StoreProductCandidate"("entityType", "entityId", "status", "matchScore");
CREATE INDEX "StoreProductCandidate_productId_idx" ON "StoreProductCandidate"("productId");
CREATE INDEX "StoreProductCandidate_status_matchScore_idx" ON "StoreProductCandidate"("status", "matchScore");

ALTER TABLE "StoreProductCandidate" ADD CONSTRAINT "StoreProductCandidate_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StoreProductOfferSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "externalId" TEXT,
    "price" TEXT,
    "originalPrice" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "soldCount" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "isHidden" BOOLEAN NOT NULL,
    "hasOfficialLink" BOOLEAN NOT NULL DEFAULT false,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityReasons" JSONB NOT NULL DEFAULT '[]',
    "riskFlags" JSONB NOT NULL DEFAULT '[]',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreProductOfferSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoreProductOfferSnapshot_productId_capturedAt_idx" ON "StoreProductOfferSnapshot"("productId", "capturedAt");
CREATE INDEX "StoreProductOfferSnapshot_store_externalId_idx" ON "StoreProductOfferSnapshot"("store", "externalId");
CREATE INDEX "StoreProductOfferSnapshot_capturedAt_idx" ON "StoreProductOfferSnapshot"("capturedAt");

ALTER TABLE "StoreProductOfferSnapshot" ADD CONSTRAINT "StoreProductOfferSnapshot_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
