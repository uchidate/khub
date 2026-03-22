-- Adiciona suporte a content blocks e templates no BlogPost
-- blocks: conteúdo em blocos JSON (quando não-nulo, tem precedência sobre contentMd)
-- template: tipo de template usado ('idol_bio', 'review', 'ranking', 'free')

ALTER TABLE "BlogPost" ADD COLUMN "blocks" JSONB;
ALTER TABLE "BlogPost" ADD COLUMN "template" TEXT;
