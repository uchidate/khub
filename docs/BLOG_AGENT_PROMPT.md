# Prompt Template — Geração de Artigos de Blog via Agente

Use este template para lançar um agente gerador de artigos. Preencha os campos marcados com `{{}}` e cole no Agent tool com `subagent_type: general-purpose`.

---

## Template: Biografia de Artista/Ator

```
Write a blog article JSON file about {{NOME DO ARTISTA}} for the HallyuHub website. Save it to /tmp/{{slug}}.json.

## Style Rules (MANDATORY)
- 1600-1800 words total across all blog_paragraph blocks
- Conversational, opinionated voice — NOT neutral journalism
- Short impact sentences mixed with longer ones for rhythm variation
- NEVER open with birth/bio chronology — open with hook/situation/paradox
- Avoid AI vocabulary: "evidenciou", "demonstrou", "trajetória única", "é inegável"
- Second person sparingly: "você percebe", "quem chegou pelo drama X"
- All text in PT-BR Portuguese
- Use ALL available block types: blog_curiosity, blog_highlight, blog_quote, blog_callout, blog_image, blog_stats_row

## Article structure
- blog_artist_card (compact: true, artistId: {{ARTIST_ID}}) with a descriptive note
- 2 opening hook paragraphs — NO bio chronology
- blog_stats_row — biographical table (name, birth, group, agency, etc.)
- 5-7 H2 sections with production cards, curiosity blocks, quotes, callouts
- Closing section with links to /artists and /productions
- blog_divider at end

## Key Facts
- Artist ID: {{ARTIST_ID}}
- Real name: {{NOME REAL}}
- Born: {{DATA DE NASCIMENTO}}
- Agency: {{AGÊNCIA}}
- Known for: {{DRAMAS / FILMES PRINCIPAIS}}
- Hook angle: {{PARADOXO OU SITUAÇÃO INTERESSANTE PARA ABRIR O ARTIGO}}

## Production IDs available
{{LISTA DE PRODUÇÕES COM IDs}}
(Use `docker exec <container> npx tsx scripts/search.ts "nome da produção"` to find IDs)

## Cover image (verify HTTP 200 before using)
- coverImageUrl: {{URL DO BACKDROP TMDB}}
(Find via: curl "https://api.themoviedb.org/3/search/tv?api_key=411337d42a0431084f39266c265688aa&query=NOME")

## SEO Requirements
- title: ≤60 chars
- excerpt: ≤130 chars
- category: "artistas"
- tags: exactly 4 (from vocabulary in blog-style-guide.md)
- slug: {{slug-do-artigo}}
- Internal links minimum 4 using [text](/path) format

## JSON structure
{
  "title": "...",
  "slug": "{{slug}}",
  "excerpt": "...",
  "coverImageUrl": "...",
  "category": "artistas",
  "tags": [...],
  "readingTimeMin": 9,
  "template": "free",
  "blocks": [...]
}

Each block needs "id" field: i00 (artist card), i01, i02 (intro), i03 (stats), then c01/d01/e01/x01... per section.

Write complete JSON and save to /tmp/{{slug}}.json.
```

---

## Template: Análise de Drama/Série

```
Write a blog article JSON file about the Korean drama "{{NOME DO DRAMA}}" for the HallyuHub website. Save it to /tmp/{{slug}}.json.

This is a DRAMA ANALYSIS article. The angle is: {{ÂNGULO EDITORIAL}}.

## Style Rules (MANDATORY)
- 1600-1800 words total across all blog_paragraph blocks
- Conversational, opinionated voice — NOT neutral journalism
- Short impact sentences mixed with longer ones for rhythm variation
- NEVER open with "X é um drama sobre..." — open with hook/paradox/situation
- All text in PT-BR Portuguese
- Use ALL available block types: blog_curiosity, blog_highlight, blog_quote, blog_callout, blog_image, blog_stats_row

## Key Facts about the drama
- Korean title: {{TÍTULO COREANO}}
- Network: {{REDE}} / Netflix, {{ANO}}
- Episodes: {{EPISÓDIOS}}
- Cast: {{ELENCO PRINCIPAL}}
- Director: {{DIRETOR}}
- Writer: {{ROTEIRISTA}}
- {{FATOS RELEVANTES — audiência, prêmios, recordes, contexto}}

## Production ID
- {{NOME}}: {{PRODUCTION_ID}}
(Find via: docker exec <container> npx tsx scripts/search.ts "nome do drama")

## Cover image (verify HTTP 200)
- coverImageUrl: {{URL TMDB BACKDROP}}

## Article structure
- blog_production_card (compact: true) at top
- blog_stats_row: rede, episódios, estreia, diretor, roteirista, plataforma
- H2 sections: {{SEÇÕES TEMÁTICAS}}
- blog_image (fullWidth: true) mid-article
- blog_curiosity, blog_highlight, blog_quote, blog_callout blocks
- Internal links to /productions, /artists, other blog posts
- blog_divider at end

## SEO Requirements
- title: ≤60 chars
- excerpt: ≤130 chars
- category: "k-drama"
- tags: exactly 4
- slug: {{slug}}
- Internal links minimum 4

Write complete JSON and save to /tmp/{{slug}}.json.
```

---

## Como usar

### 1. Buscar IDs antes de escrever

```bash
# Artista
sshpass -p 'a4/Kncd@n(cYrKFeICUq' ssh -i ~/.ssh/id_ed25519 root@31.97.255.107 \
  "docker exec \$(docker ps --format '{{.Names}}' | grep '^e6h2') npx tsx scripts/search.ts 'nome'"

# Atalho — salvar como alias no shell:
alias khub-search='sshpass -p "a4/Kncd@n(cYrKFeICUq" ssh -i ~/.ssh/id_ed25519 root@31.97.255.107 "docker exec \$(docker ps --format \"{{.Names}}\" | grep \"^e6h2\") npx tsx scripts/search.ts"'
# Uso: khub-search "Gong Yoo"
```

### 2. Gerar artigo (via Agent tool)

Preencha o template acima e lance como agente em background. Um artigo leva ~2-3 minutos.

### 3. Validar SEO antes de inserir

```bash
python3 -c "
import json
with open('/tmp/artigo.json') as f: d = json.load(f)
words = sum(len(b.get('text','').split()) for b in d['blocks'] if b['type'] == 'blog_paragraph')
print(f'Título: {len(d[\"title\"])} chars')
print(f'Excerpt: {len(d[\"excerpt\"])} chars')
print(f'Palavras: ~{words}')
print(f'Tags: {len(d[\"tags\"])}')
assert len(d['title']) <= 60
assert len(d['excerpt']) <= 130
assert words >= 1300
assert len(d['tags']) == 4
print('SEO OK ✓')
"
```

### 4. Inserir no banco

```bash
CONTAINER=$(sshpass -p 'a4/Kncd@n(cYrKFeICUq' ssh -i ~/.ssh/id_ed25519 root@31.97.255.107 \
  "docker ps --format '{{.Names}}' | grep '^e6h2xvvpu8i2jmzcb3tpzmxo-'")
cat /tmp/artigo.json | sshpass -p 'a4/Kncd@n(cYrKFeICUq' ssh -i ~/.ssh/id_ed25519 root@31.97.255.107 \
  "docker exec -i $CONTAINER npx tsx scripts/insert-article.ts /dev/stdin"
```

### 5. Verificar em produção

Acesse `https://www.hallyuhub.com.br/blog/{{slug}}` para confirmar.

---

## Referências

- Estilo e tom detalhados: `memory/blog-style-guide.md`
- Tipos de blocos disponíveis: `lib/types/blocks.ts`
- Script de inserção: `scripts/insert-article.ts`
- Script de busca de IDs: `scripts/search.ts`
- TMDB API key: `411337d42a0431084f39266c265688aa`
