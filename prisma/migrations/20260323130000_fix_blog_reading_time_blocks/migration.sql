-- Recalcula readingTimeMin para posts que usam blocos (blocks > contentMd)
-- Extrai texto de text/caption/author e aplica 238 wpm
WITH block_text AS (
  SELECT id,
    (SELECT string_agg(val, ' ')
     FROM jsonb_array_elements(blocks::jsonb) AS b,
          LATERAL (
            SELECT b->>'text' UNION ALL SELECT b->>'caption' UNION ALL SELECT b->>'author'
          ) AS texts(val)
     WHERE val IS NOT NULL
    ) AS extracted
  FROM "BlogPost"
  WHERE blocks IS NOT NULL AND jsonb_array_length(blocks::jsonb) > 0
),
word_counts AS (
  SELECT id, array_length(string_to_array(trim(extracted), ' '), 1) AS words
  FROM block_text WHERE extracted IS NOT NULL AND trim(extracted) <> ''
)
UPDATE "BlogPost" p
SET "readingTimeMin" = GREATEST(1, ROUND(words::numeric / 238))
FROM word_counts w
WHERE p.id = w.id;
