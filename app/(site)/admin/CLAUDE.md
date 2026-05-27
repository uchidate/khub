# Admin — Padrões de Desenvolvimento

## Estrutura

Cada seção do admin tem: `page.tsx` (Server Component ou Client Component) + componentes client em `components/admin/`.
Rotas API em `app/api/admin/[entidade]/route.ts`.

## Regras obrigatórias

- `export const dynamic = 'force-dynamic'` em toda página admin que usa Server Component com dados em tempo real
- Autenticação via `auth()` de `@/lib/auth` — **não usar `getServerSession`**
- Verificar `session.user.role === 'ADMIN'` antes de qualquer operação sensível
- Queries admin podem buscar `isHidden: true` (diferente das páginas públicas)
- Paginação obrigatória: padrão `take: 20`, máximo `take: 100`

## Padrões de componentes

| Necessidade | Componente correto |
|---|---|
| Toast de sucesso/erro | `useAdminToast` de `@/lib/hooks/useAdminToast` |
| Confirmação destrutiva | `ConfirmDialog` de `@/components/admin` |
| Modal com formulário | `FormModal` de `@/components/admin` |
| Modal customizado | `AdminModalOverlay` de `@/components/admin` |
| Tabela com dados | `DataTable` de `@/components/admin/DataTable` |
| Tabs de navegação | `AdminTabGroup` de `@/components/admin/AdminTabGroup` |
| Estado vazio | `AdminEmptyState` de `@/components/admin` |
| Skeleton de carregamento | `AdminTableSkeleton` de `@/components/admin/AdminTableSkeleton` |
| Botão | `AdminButton` / `AdminLinkButton` de `@/components/admin` |
| Badge | `AdminBadge` de `@/components/admin/AdminBadge` |
| Input de busca | `AdminSearchInput` de `@/components/admin/AdminSearchInput` |
| Cabeçalho de seção | `SectionHeader` de `@/components/admin/SectionHeader` |

## Áreas existentes

| Rota | Função |
|------|--------|
| `/admin` | Dashboard principal |
| `/admin/artists` | CRUD artistas + enriquecimento |
| `/admin/groups` | CRUD grupos musicais |
| `/admin/productions` | CRUD produções (K-Drama, filmes) |
| `/admin/albums` | Catálogo de álbuns |
| `/admin/agencies` | Agências |
| `/admin/blog` | Pipeline de posts, categorias, inspiração |
| `/admin/enrichment` | Fila de enriquecimento com IA |
| `/admin/pipeline` | Kanban de conteúdo |
| `/admin/news` | Notícias e importação |
| `/admin/streaming` | Shows de streaming |
| `/admin/loja` | Produtos da loja, cupons, importação |
| `/admin/seo` | Gestão de SEO por página |
| `/admin/tags` | Tags globais e mesclagem |
| `/admin/users` | Gestão de usuários |
| `/admin/comments` | Moderação de comentários |
| `/admin/emails` | Histórico de emails e templates |
| `/admin/ai` | Dashboard e logs de IA |
| `/admin/ai/config` | Configuração de providers por feature |
| `/admin/analytics` | GA4 + Search Console |
| `/admin/activity` | Log de atividade administrativa |
| `/admin/image-audit` | Auditoria de imagens |
| `/admin/server-logs` | Logs de servidor |
| `/admin/infrastructure` | Deploy e infra |
| `/admin/database` | Contadores do banco |
| `/admin/settings` | Configurações do site |
| `/admin/hidden` | Itens ocultos do site público |
| `/admin/filmography` | Filmografias de artistas |
| `/admin/translations` | Traduções de conteúdo |
| `/admin/instagram` | Status do feed de Instagram |
| `/admin/trending` | Conteúdo em alta |
