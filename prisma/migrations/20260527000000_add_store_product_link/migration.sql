-- CreateTable
CREATE TABLE "StoreProductLink" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreProductLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreProductLink_productId_entityType_entityId_key" ON "StoreProductLink"("productId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "StoreProductLink_entityType_entityId_idx" ON "StoreProductLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "StoreProductLink_productId_idx" ON "StoreProductLink"("productId");

-- AddForeignKey
ALTER TABLE "StoreProductLink" ADD CONSTRAINT "StoreProductLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
