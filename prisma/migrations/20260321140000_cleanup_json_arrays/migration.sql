-- Limpa valores inválidos (0, strings vazias, null) dos campos JSON array nas produções
-- Motivo: imports antigos podiam gravar [0] ou ["0"] nesses campos, causando exibição de "0" no site público

-- streamingPlatforms: manter apenas strings não-vazias e != '0'
UPDATE "Production"
SET "streamingPlatforms" = COALESCE(
  (SELECT jsonb_agg(val)
   FROM jsonb_array_elements_text("streamingPlatforms"::jsonb) AS val
   WHERE val IS NOT NULL AND trim(val) <> '' AND val <> '0'),
  '[]'::jsonb
)
WHERE "streamingPlatforms" IS NOT NULL
  AND "streamingPlatforms"::text <> '[]'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text("streamingPlatforms"::jsonb) AS val
    WHERE val IS NULL OR trim(val) = '' OR val = '0'
  );

-- tags: manter apenas strings não-vazias e != '0'
UPDATE "Production"
SET "tags" = COALESCE(
  (SELECT jsonb_agg(val)
   FROM jsonb_array_elements_text("tags"::jsonb) AS val
   WHERE val IS NOT NULL AND trim(val) <> '' AND val <> '0'),
  '[]'::jsonb
)
WHERE "tags" IS NOT NULL
  AND "tags"::text <> '[]'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text("tags"::jsonb) AS val
    WHERE val IS NULL OR trim(val) = '' OR val = '0'
  );

-- galleryUrls: manter apenas URLs válidas (começam com http)
UPDATE "Production"
SET "galleryUrls" = COALESCE(
  (SELECT jsonb_agg(val)
   FROM jsonb_array_elements_text("galleryUrls"::jsonb) AS val
   WHERE val IS NOT NULL AND val LIKE 'http%'),
  '[]'::jsonb
)
WHERE "galleryUrls" IS NOT NULL
  AND "galleryUrls"::text <> '[]'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text("galleryUrls"::jsonb) AS val
    WHERE val IS NULL OR val NOT LIKE 'http%'
  );

-- sourceUrls: manter apenas URLs válidas (começam com http)
UPDATE "Production"
SET "sourceUrls" = COALESCE(
  (SELECT jsonb_agg(val)
   FROM jsonb_array_elements_text("sourceUrls"::jsonb) AS val
   WHERE val IS NOT NULL AND val LIKE 'http%'),
  '[]'::jsonb
)
WHERE "sourceUrls" IS NOT NULL
  AND "sourceUrls"::text <> '[]'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text("sourceUrls"::jsonb) AS val
    WHERE val IS NULL OR val NOT LIKE 'http%'
  );
