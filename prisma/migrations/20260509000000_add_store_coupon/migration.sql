CREATE TABLE "StoreCoupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discount" TEXT NOT NULL,
    "minPurchase" TEXT,
    "store" TEXT NOT NULL DEFAULT 'shopee',
    "affiliateUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreCoupon_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoreCoupon_expiresAt_isActive_idx" ON "StoreCoupon"("expiresAt", "isActive");
