-- CreateTable
CREATE TABLE "ContentTranslation" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentTranslation_entityType_entityId_field_locale_key" ON "ContentTranslation"("entityType", "entityId", "field", "locale");

-- CreateIndex
CREATE INDEX "ContentTranslation_entityType_entityId_idx" ON "ContentTranslation"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentTranslation_entityType_status_idx" ON "ContentTranslation"("entityType", "status");

-- CreateIndex
CREATE INDEX "TranslationLog_entityType_entityId_idx" ON "TranslationLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "TranslationLog_createdAt_idx" ON "TranslationLog"("createdAt");
