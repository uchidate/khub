ALTER TABLE "Artist" ADD COLUMN "videos" JSONB;

UPDATE "Artist"
SET "videos" = '[
  {"title":"IU - Love wins all","url":"https://www.youtube.com/watch?v=JleoAppaxi0"},
  {"title":"IU - Palette feat. G-DRAGON","url":"https://www.youtube.com/watch?v=d9IxdwEFk1c"},
  {"title":"IU - Celebrity","url":"https://www.youtube.com/watch?v=0-q1KafFCLU"},
  {"title":"IU - eight feat. SUGA","url":"https://www.youtube.com/watch?v=TgOu00Mf3kI"}
]'::jsonb
WHERE "slug" = 'lee-ji-eun'
  AND "videos" IS NULL;
