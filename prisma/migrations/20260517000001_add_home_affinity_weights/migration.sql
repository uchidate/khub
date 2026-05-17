ALTER TABLE "system_settings"
ADD COLUMN "homeAffinityArtistWeight" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "homeAffinityGroupWeight" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "homeAffinityProductionWeight" INTEGER NOT NULL DEFAULT 2;
