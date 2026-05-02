# Admin — Padrões de Desenvolvimento

## Estrutura

Cada seção do admin tem: `page.tsx` (Server Component) + componentes client em `components/admin/`.
Rotas API em `app/api/admin/[entidade]/route.ts`.

## Regras

- `export const dynamic = 'force-dynamic'` em toda página admin com dados em tempo real
- Autenticação via `getServerSession` — verificar role `ADMIN` antes de qualquer operação
- Queries admin podem buscar `isHidden: true` (diferente das páginas públicas)
- Paginação obrigatória: padrão `take: 20`, máximo `take: 100`

## Áreas existentes

| Rota | Função |
|------|--------|
| `/admin/artists` | CRUD artistas + enriquecimento |
| `/admin/blog` | Pipeline de posts, categorias |
| `/admin/enrichment` | Fila de enriquecimento com IA |
| `/admin/pipeline` | Kanban de conteúdo |
| `/admin/productions` | CRUD produções |
| `/admin/streaming` | Shows de streaming |
| `/admin/news` | Notícias |
| `/admin/settings` | Configurações do site |

## Componentes disponíveis

- `components/admin/AdminTable` — tabela com paginação padrão
- `components/admin/AdminForm` — formulário com validação
- `components/ui/Button`, `Card`, `Badge` — design system compartilhado
