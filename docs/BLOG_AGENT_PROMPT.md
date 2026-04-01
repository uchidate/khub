# Prompt Template — Geração de Artigos de Blog

Use estes templates para gerar artigos. Preencha os campos `{{}}` e cole no Agent tool.

---

## CAMPOS DE BLOCO — REGRAS CRÍTICAS (NUNCA VIOLAR)

| Bloco | Campo correto | Campo ERRADO |
|-------|--------------|--------------|
| `blog_paragraph` | `text` | ~~`content`~~ |
| `blog_curiosity` | `text`, sem `title` | ~~`content`~~, ~~`title`~~ |
| `blog_highlight` | `text` | ~~`content`~~ |
| `blog_callout` | `text` | ~~`content`~~ |
| `blog_stats_row` | `items: [{label, value}]` | ~~`stats`~~, ~~`sublabel`~~ |

---

## Tipos de bloco disponíveis

```typescript
blog_heading:        { type: 'blog_heading'; text: string; level?: 2|3 }
blog_paragraph:      { type: 'blog_paragraph'; text: string }
blog_image:          { type: 'blog_image'; url: string; caption?: string; alt?: string }
blog_artist_card:    { type: 'blog_artist_card'; artistId: string }
blog_production_card:{ type: 'blog_production_card'; productionId: string }
blog_stats_row:      { type: 'blog_stats_row'; items: Array<{label: string; value: string}> }
blog_curiosity:      { type: 'blog_curiosity'; text: string; emoji?: string }
blog_highlight:      { type: 'blog_highlight'; text: string; attribution?: string }
blog_callout:        { type: 'blog_callout'; text: string; emoji?: string }
blog_quote:          { type: 'blog_quote'; text: string; author?: string }
blog_divider:        { type: 'blog_divider' }
```

Inline markdown suportado em `text`: `**bold**`, `*italic*`, `[link](url)`, `**[link bold](url)**`

---

## Template: Biografia de Artista/Ator

```
Escreva um artigo completo em português brasileiro sobre {{NOME DO ARTISTA}} para o blog HallyuHub.

## Dados do banco:
- ID artista: {{ARTIST_ID}}
- Nome: {{NOME COMPLETO}} ({{HANGUL}})
- Nascido(a): {{DATA}}, {{LOCAL}}
- Grupo/Agência: {{GRUPO}}
- Roles: {{ATOR/CANTOR/etc}}

## Produções no banco:
{{LISTA: - Título (ano, tipo) - id: xxxxx}}

## REGRAS CRÍTICAS de campos (NUNCA usar outros nomes):
- blog_paragraph: campo `text` (NUNCA `content`)
- blog_stats_row: campo `items: [{label, value}]` (NUNCA `stats`, NUNCA `sublabel`)
- blog_curiosity: campo `text` (NUNCA `content`), sem campo `title`
- blog_highlight: campo `text` (NUNCA `content`)
- blog_callout: campo `text` (NUNCA `content`)

## Tipos de bloco disponíveis:
blog_heading, blog_paragraph, blog_artist_card, blog_production_card,
blog_stats_row, blog_curiosity, blog_highlight, blog_callout, blog_quote, blog_divider

## Estrutura obrigatória do JSON:
{
  "title": "...",        // máx 60 chars
  "slug": "...",         // kebab-case, sem acentos
  "excerpt": "...",      // máx 130 chars
  "category": "{{artistas|k-pop|k-drama|k-film|grupos|cultura|k-beauty|reality-shows|webtoons}}",
  "tags": ["tag1", "tag2", "tag3", "tag4"],  // EXATAMENTE 4 tags
  "artistIds": ["{{ARTIST_ID}}"],
  "productionIds": [],   // apenas IDs de produções com blog_production_card
  "blocks": [...]
}

## Diretrizes de conteúdo:
- Mínimo 1300 palavras somadas nos blog_paragraph
- Tom: admirativo mas factual, para fãs brasileiros
- Estrutura sugerida:
  1. blog_artist_card
  2. Introdução impactante (2 blog_paragraph)
  3. blog_highlight com frase/conquista icônica
  4. Seção de origem/infância
  5. blog_stats_row com dados biográficos
  6. 4-6 seções H2 cobrindo carreira, projetos principais
  7. blog_production_card para projetos principais
  8. blog_curiosity (2-3 ao longo do artigo)
  9. Conclusão/legado
  10. blog_callout final

## Retorne APENAS o JSON do artigo, sem texto antes ou depois.
```

---

## Template: Análise de Drama/Série

```
Escreva um artigo completo em português brasileiro sobre o drama/série "{{NOME}}" para o blog HallyuHub.

## Dados do banco:
- ID produção: {{PRODUCTION_ID}}
- Título PT: {{TÍTULO EM PORTUGUÊS}}
- Título coreano: {{TÍTULO COREANO}}
- Ano: {{ANO}} | Rede: {{REDE/PLATAFORMA}}
- Episódios: {{N}} | Gênero: {{GÊNERO}}
- Elenco principal: {{ATORES PRINCIPAIS}}
- Diretor: {{DIRETOR}} | Roteirista: {{ROTEIRISTA}}

## Artistas relacionados no banco:
{{LISTA: - Nome (papel) - id: xxxxx}}

## REGRAS CRÍTICAS de campos: (mesmas acima)

## Estrutura obrigatória do JSON:
{
  "title": "...",        // máx 60 chars
  "slug": "...",
  "excerpt": "...",      // máx 130 chars
  "category": "{{k-drama|k-film|k-pop|...}}",
  "tags": ["tag1", "tag2", "tag3", "tag4"],  // EXATAMENTE 4 tags
  "artistIds": [],
  "productionIds": ["{{PRODUCTION_ID}}"],
  "blocks": [...]
}

## Estrutura sugerida:
  1. blog_production_card
  2. Introdução com hook (NÃO abrir com "X é um drama sobre...")
  3. blog_stats_row (rede, episódios, plataforma, gênero)
  4. blog_highlight com frase/cena icônica
  5. 5-6 seções H2 temáticas
  6. blog_artist_card para atores principais
  7. blog_curiosity (2-3 ao longo)
  8. Análise final/recomendação
  9. blog_callout

## Retorne APENAS o JSON do artigo, sem texto antes ou depois.
```

---

## Fluxo completo de criação

### 1. Buscar IDs no banco

```bash
# Artista ou produção por nome
ssh -p 22 -i ~/.ssh/id_ed25519 root@31.97.255.107 \
  "docker exec \$(docker ps --format '{{.Names}}' | grep '^e6h2') npx tsx scripts/search.ts 'nome'"

# Direto via psql (mais rápido)
ssh -p 22 -i ~/.ssh/id_ed25519 root@31.97.255.107 \
  "docker exec nv2l757xetlkuyg65k7zib9h psql -U hallyuhub -d hallyuhub_production -t -c \
  \"SELECT id, \\\"nameRomanized\\\", \\\"nameHangul\\\" FROM \\\"Artist\\\" WHERE \\\"nameRomanized\\\" ILIKE '%nome%' LIMIT 5;\""
```

### 2. Gerar artigo (via Agent tool)

Preencha o template acima e lance como agente. Um artigo leva ~2-3 minutos.

### 3. Validar SEO

```bash
python3 -c "
import json
with open('/tmp/artigo.json') as f: d = json.load(f)
words = sum(len(b.get('text','').split()) for b in d['blocks'] if b['type'] == 'blog_paragraph')
print(f'Título: {len(d[\"title\"])} chars (max 60)')
print(f'Excerpt: {len(d[\"excerpt\"])} chars (max 130)')
print(f'Palavras: ~{words} (min 1300)')
print(f'Tags: {len(d[\"tags\"])} (must be 4)')
ok = len(d['title'])<=60 and len(d['excerpt'])<=130 and words>=1300 and len(d['tags'])==4
print('SEO OK ✓' if ok else 'SEO FALHOU ✗')
"
```

### 4. Buscar imagem de capa

```bash
python3 scripts/find-cover-image.py "Nome do Artista"
# Retorna URL válida do Wikimedia Commons

# Adicionar ao JSON:
# "coverImageUrl": "https://upload.wikimedia.org/..."
```

### 5. Inserir no banco

```bash
# Copiar JSON para o servidor e inserir
scp -P 22 -i ~/.ssh/id_ed25519 /tmp/artigo.json root@31.97.255.107:/tmp/artigo.json
ssh -p 22 -i ~/.ssh/id_ed25519 root@31.97.255.107 \
  "python3 /app/scripts/insert-blog-post.py /tmp/artigo.json"

# OU rodar localmente (se o script tiver acesso ao Docker):
python3 scripts/insert-blog-post.py /tmp/artigo.json
```

### 6. Verificar em produção

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.hallyuhub.com.br/blog/{{slug}}
# Deve retornar 200
```

---

## Categorias disponíveis

| slug | ID |
|------|----|
| artistas | 9d530e53-0570-48ec-9fb8-6844aeaaf213 |
| cultura | cff5f488-c7c4-4505-85e9-ea232cc317a0 |
| grupos | 09ce30d4-3005-4691-9d75-bec30aea954a |
| k-beauty | 554df076-a799-4d68-ab79-86e2021d7822 |
| k-drama | cmn1xy00v00013umxo7l3obvm |
| k-film | 478d063d-5113-49cd-975c-bb720dc39bf7 |
| k-pop | cmn1xy00i00003umx9zj98z0i |
| reality-shows | 9acbfbbd-7bfd-472e-a2ba-2122167ea2c6 |
| webtoons | 6fa8e0d8-49d0-4770-bd66-3e95073bef2a |

---

## Referências

- Script de inserção: `scripts/insert-blog-post.py`
- Script de busca de imagem: `scripts/find-cover-image.py`
- Script de busca de IDs: `scripts/search.ts`
- Tipos de blocos: `lib/types/blocks.ts`
- TMDB API key: `411337d42a0431084f39266c265688aa`
- Author ID padrão: `f6c14838-660b-4c77-9d06-32c30e4de7d5` (Fabio Uchidate)
