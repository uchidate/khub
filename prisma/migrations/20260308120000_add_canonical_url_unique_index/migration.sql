-- Migration: add_canonical_url_unique_index
--
-- Cria uma função IMMUTABLE que normaliza sourceUrl (remove UTM e tracking params)
-- e um índice único de expressão baseado nessa função.
--
-- Isso garante que dois registros com a mesma URL canônica (com ou sem UTM)
-- não possam coexistir no banco, independente de o código ter normalizado ou não.
--
-- O @unique em sourceUrl é mantido para compatibilidade com o ORM (findUnique, upsert),
-- mas como todos os valores são normalizados antes de gravar, ambos apontam para o mesmo espaço.

-- Função IMMUTABLE para normalizar URLs (remove parâmetros de rastreamento)
CREATE OR REPLACE FUNCTION normalize_source_url(url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
    SELECT regexp_replace(
        regexp_replace(
            regexp_replace(
                url,
                '[?&](utm_source|utm_medium|utm_campaign|utm_content|utm_term|utm_id|ref|fbclid|gclid|_ga)=[^&]*',
                '',
                'g'
            ),
            '[?&]$',
            '',
            'g'
        ),
        '\?&',
        '?',
        'g'
    )
$$;

-- Índice único de expressão na URL canônica
-- Partial index: exclui sourceUrl vazio (artigos sem link externo)
CREATE UNIQUE INDEX news_canonical_url_idx
    ON "News" (normalize_source_url("sourceUrl"))
    WHERE "sourceUrl" != '';
