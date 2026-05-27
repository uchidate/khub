CREATE TABLE "StoreAffiliateClick" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "couponId" TEXT,
    "placement" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreAffiliateClick_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StoreAffiliateClick_target_check" CHECK (
        ("productId" IS NOT NULL AND "couponId" IS NULL)
        OR ("productId" IS NULL AND "couponId" IS NOT NULL)
    )
);

CREATE INDEX "StoreAffiliateClick_productId_createdAt_idx" ON "StoreAffiliateClick"("productId", "createdAt");
CREATE INDEX "StoreAffiliateClick_couponId_createdAt_idx" ON "StoreAffiliateClick"("couponId", "createdAt");
CREATE INDEX "StoreAffiliateClick_placement_createdAt_idx" ON "StoreAffiliateClick"("placement", "createdAt");
CREATE INDEX "StoreAffiliateClick_createdAt_idx" ON "StoreAffiliateClick"("createdAt");

ALTER TABLE "StoreAffiliateClick" ADD CONSTRAINT "StoreAffiliateClick_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoreAffiliateClick" ADD CONSTRAINT "StoreAffiliateClick_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "StoreCoupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
