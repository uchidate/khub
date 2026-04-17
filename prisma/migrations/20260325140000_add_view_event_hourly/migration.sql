-- ViewEventHourly: granularidade de 15 minutos (slot 0-95)
-- slot = Math.floor(hora * 4 + minuto / 15)
CREATE TABLE IF NOT EXISTS "ViewEventHourly" (
    "entityType" TEXT NOT NULL,
    "entityId"   TEXT NOT NULL,
    "date"       DATE NOT NULL,
    "slot"       INTEGER NOT NULL,
    "count"      INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ViewEventHourly_pkey" PRIMARY KEY ("entityType", "entityId", "date", "slot")
);
CREATE INDEX IF NOT EXISTS "ViewEventHourly_date_slot_idx" ON "ViewEventHourly"("date", "slot");
CREATE INDEX IF NOT EXISTS "ViewEventHourly_entityType_date_idx" ON "ViewEventHourly"("entityType", "date");
