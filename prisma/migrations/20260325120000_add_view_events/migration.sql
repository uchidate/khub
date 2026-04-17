-- CreateTable: ViewEvent (série temporal de views por entidade/dia)
CREATE TABLE IF NOT EXISTS "ViewEvent" (
    "entityType" TEXT NOT NULL,
    "entityId"   TEXT NOT NULL,
    "date"       DATE NOT NULL,
    "count"      INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ViewEvent_pkey" PRIMARY KEY ("entityType", "entityId", "date")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ViewEvent_date_idx"             ON "ViewEvent"("date");
CREATE INDEX IF NOT EXISTS "ViewEvent_entityType_date_idx"  ON "ViewEvent"("entityType", "date");
