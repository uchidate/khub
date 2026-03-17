-- Remove deprecated fields (betaMode, premiumEnabled) and add maintenanceMode
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "betaMode";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "premiumEnabled";
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;
