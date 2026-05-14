# HallyuHub — Contexto do Projeto

Site de cultura coreana (K-Pop, K-Drama, K-Beauty) com conteúdo dinâmico, blog editorial, calendário de eventos e painel admin.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript 6)
- **Prisma 7** com `prisma.config.ts` (obrigatório — URL datasource saiu do schema)
- **PostgreSQL** (produção/staging via Coolify; dev local)
- **NextAuth** para autenticação
- **Tailwind CSS** com variáveis CSS (`bg-background`, `text-foreground`, `text-accent`, `text-muted`, `bg-surface`, `bg-surface-hover`)
- **Coolify** como plataforma de deploy (Traefik como reverse proxy)

## Estrutura de pastas

```
app/(site)/          → páginas públicas (artists, productions, blog, calendario, etc.)
app/(site)/admin/    → painel admin (artists, blog, enrichment, pipeline, etc.)
components/
  ui/                → componentes base (Button, Card, Breadcrumbs, etc.)
  home/              → widgets da homepage
  admin/             → componentes do painel admin
  blog/              → renderizador de blocos de conteúdo
lib/
  prisma.ts          → singleton PrismaClient
  repositories/      → queries encapsuladas por entidade
  services/          → lógica de negócio (email, AI, etc.)
  ai/                → integração com LLMs
prisma/schema.prisma → schema principal
prisma-kpopping/     → schema secundário (integração Kpopping)
scripts/             → scripts de manutenção e cron
```

## Modelos principais do Prisma

`Artist`, `MusicalGroup`, `Production`, `Album`, `Agency`, `BlogPost`, `BlogCategory`, `News`, `Tag`, `User`, `Favorite`, `UserList`, `WatchEntry`, `StreamingShow`, `SeoMeta`, `AiConfig`, `ViewEvent`

## Deploy — REGRA DE OURO

**NUNCA modificar via SSH.** Fluxo único:

```bash
git checkout -b feat/nome
git add . && git commit -m "mensagem"
git push origin feat/nome
gh pr create --title "..." --body "..."
# GitHub Actions faz TUDO: build, push registry, deploy
```

- Branch `main` protegida → só via PR
- Pre-push hook valida TypeScript + ESLint antes de permitir push
- SSH apenas para consulta (logs, health check)

## Servidores

- **IP:** `31.97.255.107` (root)
- **Produção:** https://www.hallyuhub.com.br | DB: `hallyuhub_production`
- **Staging:** https://staging.hallyuhub.com.br | DB: `hallyuhub_staging`
- **Postgres prod:** container `nv2l757xetlkuyg65k7zib9h`, IP interno `10.0.1.5:5432`
- **Postgres staging:** container `xhja77fygkk15upqztd3la1t`, IP interno `10.0.1.7:5432`
- **MCP Postgres disponível:** `hallyuhub-postgres-production` (porta 5433) e `hallyuhub-postgres-staging` (porta 5434) via SSH tunnel

## Blog — formato de blocos

`BlogPost` armazena conteúdo como `BlogBlock[]` no campo `blocks` (JSON). Tipos:

| type | campos obrigatórios | campos opcionais |
|------|-------------------|-----------------|
| `blog_paragraph` | `text: string` | — |
| `blog_heading` | `text: string` | `level?: 2\|3` |
| `blog_image` | `url: string, alt: string` | `caption?: string` |
| `blog_gallery` | `images: {url,alt}[]` | — |
| `blog_quote` | `text: string` | `author?: string` |
| `blog_curiosity` | `text: string` ← **NÃO usar array** | — |
| `blog_list` | `items: string[]` | — |
| `blog_rating` | `score: number (0-10)` | `label?: string` |
| `blog_video` | `url: string` (YouTube/Shorts) | `caption?: string` |
| `blog_spotify` | `url: string` (open.spotify.com) | `compact?: boolean` |
| `blog_twitter` | `url: string` | — |
| `blog_instagram` | `url: string` | — |
| `blog_tiktok` | `url: string` | — |
| `blog_artist_card` | `artistId: string` | — |
| `blog_production_card` | `productionId: string` | — |
| `blog_group_card` | `groupId: string` | — |
| `blog_stats_row` | `stats: {label,value}[]` | — |
| `blog_callout` | `text: string` | `icon?: string` |
| `blog_highlight` | `text: string` | — |
| `blog_pros_cons` | `pros: string[], cons: string[]` | — |
| `blog_steps` | `steps: {title,text}[]` | — |
| `blog_product_card` | `name: string` | — |
| `blog_comparison` | `items: object[]` | — |
| `blog_timeline` | `events: {date,text}[]` | — |
| `blog_divider` | — | — |

**Inserção no banco:** escrever SQL em arquivo local → `scp` para servidor → `cat arquivo.sql | docker exec -i <container> psql -U hallyuhub hallyuhub_production`

## Padrões de código

- Componentes server por padrão; `'use client'` apenas quando necessário
- `export const dynamic = 'force-dynamic'` em páginas com dados em tempo real
- Queries sempre com `isHidden: false` e paginação/`take` limitado
- Imagens via `next/image` com `fill` + `object-cover object-top` para retratos
- Classes Tailwind: preferir variáveis CSS do design system (`bg-surface`, `text-muted`, etc.)
- Sem comentários óbvios; sem `console.log` em produção

## Secrets — NUNCA commitar

Usar placeholders (`YOUR_VALUE_HERE`) e substituir antes de qualquer `git add`.
Pre-commit hook bloqueia staging/main — feature branches obrigatórias.
