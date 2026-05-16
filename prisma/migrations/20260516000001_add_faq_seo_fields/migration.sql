-- Add faq field to Artist and Production for SEO FAQ structured data

ALTER TABLE "Artist" ADD COLUMN IF NOT EXISTS "faq" JSONB;

ALTER TABLE "Production" ADD COLUMN IF NOT EXISTS "faq" JSONB;
