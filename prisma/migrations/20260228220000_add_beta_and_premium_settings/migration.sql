-- AlterTable: add betaMode and premiumEnabled to system_settings
ALTER TABLE "system_settings"
  ADD COLUMN IF NOT EXISTS "betaMode" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "premiumEnabled" BOOLEAN NOT NULL DEFAULT false;
