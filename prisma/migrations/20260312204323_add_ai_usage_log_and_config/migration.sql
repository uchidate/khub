-- CreateTable
CREATE TABLE "ai_usage_log" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorMsg" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_config" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "preferredProvider" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "monthlyBudgetUsd" DOUBLE PRECISION,
    "notes" VARCHAR(300),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ai_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_log_createdAt_idx" ON "ai_usage_log"("createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_log_provider_createdAt_idx" ON "ai_usage_log"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_log_feature_createdAt_idx" ON "ai_usage_log"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_log_status_idx" ON "ai_usage_log"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_config_feature_key" ON "ai_config"("feature");
