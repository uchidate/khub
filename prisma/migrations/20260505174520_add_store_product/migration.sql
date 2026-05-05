-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" TEXT NOT NULL,
    "originalPrice" TEXT,
    "imageUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "store" TEXT NOT NULL DEFAULT 'shopee',
    "category" TEXT NOT NULL,
    "badge" TEXT,
    "rating" DOUBLE PRECISION,
    "soldCount" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreProduct_category_isActive_position_idx" ON "StoreProduct"("category", "isActive", "position");
CREATE INDEX "StoreProduct_store_isActive_idx" ON "StoreProduct"("store", "isActive");
CREATE INDEX "StoreProduct_featured_isActive_idx" ON "StoreProduct"("featured", "isActive");
