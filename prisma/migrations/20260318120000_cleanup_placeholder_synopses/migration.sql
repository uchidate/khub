-- Limpa sinopses que são textos de placeholder (sem conteúdo real).
-- Essas entradas estavam sendo listadas como "pendentes de tradução"
-- e consumindo tokens de IA desnecessariamente.
--
-- Textos de placeholder conhecidos:
--   "Sem sinopse disponível."  (1977 produções)
--   "No synopsis available."   (1 produção)
--
-- Além de zerar o synopsis, reseta translationStatus para NULL
-- (não é 'pending' nem 'skipped' — simplesmente não há nada a traduzir).

UPDATE "Production"
SET
    synopsis          = NULL,
    "synopsisSource"  = NULL,
    "translationStatus" = NULL,
    "translatedAt"    = NULL
WHERE synopsis IN (
    'Sem sinopse disponível.',
    'No synopsis available.'
);
