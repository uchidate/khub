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

**NUNCA via SSH.** `feat/*` branch → commit → push → PR → GitHub Actions faz tudo.
Branch `main` protegida. Pre-push valida TS + ESLint. SSH só para consulta.
Skills: `/deploy` `/deploy-pr` `/merge-pr`

## Servidores

- **root@31.97.255.107** · Produção: hallyuhub_production (porta 5433) · Staging: hallyuhub_staging (porta 5434)
- App prod: `e6h2xvvpu8i2jmzcb3tpzmxo-*` · App staging: `lssyh30tgd0qf2ba38p2f7ex-*`

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

**Inserção no banco:** usar skill `/db-insert` (escreve SQL em /tmp → docker cp → psql -f).

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

<!-- claude-token-saver:harness:begin -->
## 🅷 Harness Rules (claude-token-saver)

이 섹션은 `claude-token-saver harness init`이 생성합니다. 5가지 원칙 모두를
지키면 statusline에 `🅷 5/5`로 표시되고, 빠진 게 있으면 `🅷 3/5` 식으로
경고합니다. 수정해도 무방하지만, 섹션 헤더(### 1. ~ ### 5.)는 검출용이므로
지우지 마세요.

### 1. Ratchet — 같은 실수는 두 번 안 한다
- 같은 에러·오해·반복 작업이 한 번 더 발생하면 즉시 `.claude/ratchet.md`에
  "조건 → 행동" 한 줄로 룰 추가.
- claude-token-saver가 후보를 감지하면 statusline에 `🅷⚠ ratchet?`로 알림.
  `claude-token-saver harness promote "<rule>" --project|--global`로 승인.
- **scope는 항상 사용자에게 먼저 물어볼 것** — 프로젝트 한정이면 `--project`,
  도구·환경 일반 룰이면 `--global`(`~/.claude/ratchet.md`). Bash 환경은
  non-TTY라 CLI의 readline 프롬프트가 안 뜨므로, 호출자(LLM)가 직접 묻고
  플래그를 명시해야 함. 묻지 않고 기본값으로 등록하지 말 것.
- 승인된 룰은 다음 세션부터 자동 적용.

### 2. Evidence — "다 됐어요" 금지
완료 보고("다 됐어요", "테스트 통과") 시 다음 중 1개 이상을 항상 첨부:
- 테스트 실행 결과 (실제 stdout)
- 변경 파일 diff (file:line)
- UI 작업이면 스크린샷
- 명령 실행 출력

증거 없는 완료 보고는 거짓일 확률이 매우 높음. 토큰 낭비의 주범.

### 3. PEV — Plan → Execute → Verify
3단계 이상 작업은 다음 사이클을 강제:
1. **Plan** — 텍스트로 단계 명시 (TodoWrite 권장)
2. **Execute** — 한 단계씩 실행, 결과 확인
3. **Verify** — 테스트·실행·grep 등으로 결과 검증

Verify를 건너뛰면 statusline에 `🅷⚠ PEV-skip` 표시.
0.85의 10제곱 ≈ 0.20 — 단계당 85%만 맞아도 10단계면 80% 실패.

### 4. Structured Task — 입력 구조화
새 작업 시작 시 다음 4줄을 먼저 채울 것 (입력이 구조화돼야 출력도 구조화됨):
- **목표:** 한 문장으로
- **제약:** 시간·범위·금지사항
- **검증 방법:** 어떻게 "됐다"고 판정할지
- **완료 기준:** 무엇이 통과하면 완료인지

### 5. Default Safe Path — 파괴적 명령 항상 확인
다음 작업은 **항상** 사용자 확인 후 실행:
- 파괴적 명령: `rm -rf`, force push, drop table, kill process
- 외부 시스템: deploy, slack 발송, 댓글 작성, PR merge
- 비가역적: amend pushed commit, branch -D

단순 read·local edit·테스트 실행은 묻지 말고 즉시 진행 (마찰 최소화).

---

📌 운영:
- `claude-token-saver harness check` — 현재 셋업 점수
- `claude-token-saver harness promote "<룰>" --project|--global` — ratchet에 룰 추가 (scope는 사용자에게 먼저 물어볼 것)
- `claude-token-saver harness off` — statusline 표시 끄기
<!-- claude-token-saver:harness:end -->
