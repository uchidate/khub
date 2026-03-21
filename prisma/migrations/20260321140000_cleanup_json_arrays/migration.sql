-- Limpa valores inválidos (0, strings vazias) dos campos text[] nas produções
-- Motivo: imports antigos podiam gravar ['0'] nesses campos, causando exibição de "0" no site público
-- Nota: esses campos são text[] no PostgreSQL (não jsonb), logo usa-se unnest() em vez de jsonb_array_elements

-- streamingPlatforms: manter apenas strings não-vazias e != '0'
UPDATE "Production"
SET "streamingPlatforms" = ARRAY(
  SELECT val FROM unnest("streamingPlatforms") AS val
  WHERE val IS NOT NULL AND trim(val) <> '' AND val <> '0'
)
WHERE '0' = ANY("streamingPlatforms") OR '' = ANY("streamingPlatforms");

-- tags: manter apenas strings não-vazias e != '0'
UPDATE "Production"
SET "tags" = ARRAY(
  SELECT val FROM unnest("tags") AS val
  WHERE val IS NOT NULL AND trim(val) <> '' AND val <> '0'
)
WHERE '0' = ANY("tags") OR '' = ANY("tags");

-- galleryUrls: manter apenas URLs válidas (começam com http)
UPDATE "Production"
SET "galleryUrls" = ARRAY(
  SELECT val FROM unnest("galleryUrls") AS val
  WHERE val IS NOT NULL AND val LIKE 'http%'
)
WHERE EXISTS (
  SELECT 1 FROM unnest("galleryUrls") AS val
  WHERE val IS NULL OR val NOT LIKE 'http%'
) AND array_length("galleryUrls", 1) > 0;

-- sourceUrls: manter apenas URLs válidas (começam com http)
UPDATE "Production"
SET "sourceUrls" = ARRAY(
  SELECT val FROM unnest("sourceUrls") AS val
  WHERE val IS NOT NULL AND val LIKE 'http%'
)
WHERE EXISTS (
  SELECT 1 FROM unnest("sourceUrls") AS val
  WHERE val IS NULL OR val NOT LIKE 'http%'
) AND array_length("sourceUrls", 1) > 0;
