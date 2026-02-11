# 🎨 Roadmap de Melhorias Front-End - HallyuHub

Documento de referência para futuras melhorias e features de UX/UI do HallyuHub.

---

## ✅ Implementado (Fevereiro 2026)

### Sistema de Comentários
- ✅ Model Comment no Prisma com relações User e News
- ✅ API endpoints completos (GET/POST/DELETE) com autenticação
- ✅ Validação de conteúdo (max 1000 caracteres)
- ✅ Autorização: apenas autor ou admin podem deletar
- ✅ UI completa com formulário e lista de comentários
- ✅ Formatação de datas relativas em português (date-fns)
- ✅ Badges de role (admin, moderador, membro)
- ✅ Estados de loading, empty e error

### Página de Detalhes de Notícias
- ✅ Barra de progresso de leitura (gradient animado)
- ✅ Tempo de leitura estimado
- ✅ Tags clicáveis para busca
- ✅ Seção de artistas mencionados com avatares
- ✅ Botões de compartilhamento (Twitter, WhatsApp, copiar link)
- ✅ Notícias relacionadas (por artistas ou tags)
- ✅ Metadados enriquecidos (Open Graph, Twitter Cards)

### Página de Artistas
- ✅ Sistema de filtros avançados (busca, role, ordenação)
- ✅ Busca em tempo real com debouncing (500ms)
- ✅ Filtros por role (Cantor, Ator, Modelo, etc)
- ✅ Ordenação (nome, mais recentes, trending)
- ✅ Paginação client-side
- ✅ Visual de filtros ativos com clear buttons

### Homepage
- ✅ Seção de estatísticas com contadores animados
- ✅ Framer Motion para animações suaves
- ✅ Dados em tempo real (artistas, produções, notícias, views)
- ✅ Cache de 5 minutos para performance

### Componentes e Melhorias Visuais
- ✅ Loading skeletons para todas as páginas principais
- ✅ Animações shimmer e gradient no Tailwind
- ✅ ReadingProgressBar component
- ✅ StatsSection com AnimatedCounter
- ✅ ShareButtons component
- ✅ RelatedNews component
- ✅ NewsDetailSkeleton

---

## 🚀 Roadmap de Melhorias Futuras

### 1. Sistema de Reações/Likes nas Notícias

**Prioridade:** Alta
**Complexidade:** Média
**Estimativa:** 2-3 dias

#### Features:
- Botão de "curtir" em cards de notícias e página de detalhes
- Contador de likes visível (número de usuários que curtiram)
- Persistir preferências do usuário no banco
- Animação de feedback ao curtir/descurtir
- Mostrar "notícias mais curtidas da semana" na homepage
- Badge "trending" para notícias com muitos likes

#### Arquivos a criar:
- `app/api/news/[id]/like/route.ts` - Endpoint de like/unlike
- `components/ui/LikeButton.tsx` - Botão de like com animação
- Migração Prisma para adicionar relação NewsLike

#### Schema Prisma:
```prisma
model NewsLike {
  id        String   @id @default(cuid())
  userId    String
  newsId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  news      News     @relation(fields: [newsId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, newsId])
  @@index([newsId])
  @@index([userId])
}
```

---

### 2. Página de Perfil do Usuário

**Prioridade:** Alta
**Complexidade:** Alta
**Estimativa:** 4-5 dias

#### Features:
- Dashboard personalizado com overview de atividades
- Histórico de comentários do usuário
- Estatísticas pessoais:
  - Total de notícias lidas
  - Artistas favoritos (lista)
  - Produções favoritadas
  - Comentários totais
  - Conta desde (data de criação)
- Timeline de atividades recentes
- Seção de configurações (link para /settings)
- Avatar grande com opção de editar
- Badges/conquistas (ex: "Comentador Ativo", "Fã de K-Drama")

#### Arquivos a criar:
- `app/profile/[userId]/page.tsx` - Página de perfil público
- `app/profile/me/page.tsx` - Meu perfil (redirect para usuário logado)
- `components/features/UserStats.tsx` - Estatísticas do usuário
- `components/features/ActivityTimeline.tsx` - Timeline de atividades
- `components/features/UserCommentHistory.tsx` - Lista de comentários
- `app/api/users/[id]/stats/route.ts` - Endpoint de estatísticas

#### Queries Necessárias:
- Total de favoritos por tipo (artistas, produções, notícias)
- Total de comentários do usuário
- Últimas atividades (views, likes, comentários)
- Data de criação da conta

---

### 3. Modo de Visualização (Cards/Lista)

**Prioridade:** Média
**Complexidade:** Baixa
**Estimativa:** 1-2 dias

#### Features:
- Toggle button no header das páginas de listagem
- Dois modos de visualização:
  - **Grid (Cards):** Layout atual em grid 3 colunas
  - **Lista:** Layout mais denso, 1 coluna, mais informações visíveis
- Salvar preferência do usuário no localStorage
- Transição suave entre modos
- Ícones visuais (Grid icon / List icon)

#### Arquivos a modificar:
- `app/news/page.tsx` - Adicionar toggle e layouts
- `app/artists/page.tsx` - Adicionar toggle e layouts
- `app/productions/page.tsx` - Adicionar toggle e layouts

#### Arquivos a criar:
- `components/ui/ViewModeToggle.tsx` - Componente de toggle
- `components/layouts/GridLayout.tsx` - Layout em grid
- `components/layouts/ListLayout.tsx` - Layout em lista
- `hooks/useViewMode.ts` - Hook para gerenciar modo de visualização

---

### 4. Search/Filtros Avançados Globais

**Prioridade:** Alta
**Complexidade:** Alta
**Estimativa:** 5-6 dias

#### Features:
- Barra de busca no header (sempre visível)
- Busca unificada em todos os tipos de conteúdo:
  - Artistas (nome romanizado, hangul, stage names)
  - Notícias (título, conteúdo, tags)
  - Produções (título PT, título KR, sinopse)
- Resultados em tempo real (autocomplete dropdown)
- Categorização de resultados por tipo
- Histórico de buscas (últimas 5 buscas)
- Sugestões de busca populares
- Atalho de teclado (Ctrl/Cmd + K)

#### Arquivos a criar:
- `components/ui/GlobalSearch.tsx` - Componente de busca global
- `components/ui/SearchResults.tsx` - Dropdown de resultados
- `app/api/search/global/route.ts` - Endpoint de busca unificada
- `app/search/page.tsx` - Página de resultados completos
- `hooks/useGlobalSearch.ts` - Hook para gerenciar busca

#### Endpoint de Search:
```typescript
GET /api/search/global?q=query&types=artists,news,productions&limit=10

Response:
{
  artists: [...],
  news: [...],
  productions: [...],
  total: number,
  query: string
}
```

---

### 5. Melhorias na Homepage

**Prioridade:** Alta
**Complexidade:** Média
**Estimativa:** 3-4 dias

#### Features:

#### 5.1 Carrossel de Notícias em Destaque
- Carrossel fullwidth com 3-5 notícias principais
- Auto-play com pause on hover
- Indicadores de slide (dots)
- Navegação com setas
- Critério de destaque: mais likes + mais recentes

#### 5.2 Seção "Trending Now"
- Grid de artistas em alta
- Baseado em:
  - Trending score (já existe no schema)
  - Views recentes (últimos 7 dias)
  - Favoritos recentes
- Atualização diária via cron
- Indicador visual "🔥 Trending"

#### 5.3 "Você Pode Gostar"
- Recomendações personalizadas
- Baseado em:
  - Artistas favoritos do usuário
  - Notícias relacionadas
  - Produções do mesmo gênero
- Algoritmo simples de recomendação
- Apenas para usuários autenticados

#### 5.4 Últimas Produções Adicionadas
- Grid com 6 produções mais recentes
- Ordenado por `createdAt desc`
- Link "Ver todas" para /productions
- Badge "Novo" para produções < 7 dias

#### Arquivos a criar:
- `components/features/FeaturedCarousel.tsx` - Carrossel de destaque
- `components/features/TrendingArtists.tsx` - Artistas em alta
- `components/features/RecommendedForYou.tsx` - Recomendações
- `components/features/LatestProductions.tsx` - Últimas produções
- `app/api/recommendations/route.ts` - Endpoint de recomendações

---

### 6. Sistema de Notificações In-App

**Prioridade:** Média
**Complexidade:** Alta
**Estimativa:** 5-6 dias

#### Features:
- Bell icon no header com contador de não lidas
- Dropdown com lista de notificações
- Tipos de notificações:
  - Nova notícia de artista favorito
  - Resposta ao seu comentário
  - Novo comentário em notícia que você comentou
  - Sistema: nova feature, manutenção, etc.
- Marcar como lido/não lido
- Marcar todas como lidas
- Link direto para conteúdo relacionado
- Listagem completa em `/notifications`
- Badges visuais por tipo (cores diferentes)

#### Schema Prisma:
```prisma
model Notification {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type       String   // 'NEW_NEWS', 'COMMENT_REPLY', 'NEW_COMMENT', 'SYSTEM'
  title      String
  message    String
  link       String?  // URL para navegar ao clicar
  isRead     Boolean  @default(false)
  metadata   Json?    // Dados extras (newsId, commentId, etc)
  createdAt  DateTime @default(now())

  @@index([userId, isRead])
  @@index([createdAt])
}
```

#### Arquivos a criar:
- `components/ui/NotificationBell.tsx` - Ícone com contador
- `components/ui/NotificationDropdown.tsx` - Dropdown de notificações
- `components/features/NotificationItem.tsx` - Item de notificação
- `app/notifications/page.tsx` - Página de notificações
- `app/api/notifications/route.ts` - CRUD de notificações
- `app/api/notifications/mark-read/route.ts` - Marcar como lida
- `lib/services/notification-service.ts` - Serviço de notificações

#### Lógica de Trigger:
- Cron job verifica novos artistas favoritos com notícias → cria notificação
- Ao criar comentário → notifica autor da notícia
- Ao responder comentário → notifica autor do comentário original

---

### 7. Tema Claro (Light Mode)

**Prioridade:** Média
**Complexidade:** Média
**Estimativa:** 3-4 dias

#### Features:
- Toggle dark/light mode no header
- Paleta de cores otimizada para light mode:
  - Background: branco/cinza muito claro
  - Texto: cinza escuro/preto
  - Acentos: manter cyber purple (#bc13fe)
  - Cards: branco com sombra sutil
- Salvar preferência do usuário:
  - localStorage para não autenticados
  - Banco de dados para autenticados
- Transição suave entre temas (0.3s ease)
- Respeitar preferência do sistema (prefers-color-scheme)
- Ícone de sol/lua no toggle

#### Arquivos a modificar:
- `tailwind.config.ts` - Adicionar variáveis de tema claro
- Todos os componentes com cores hardcoded

#### Arquivos a criar:
- `components/ui/ThemeToggle.tsx` - Toggle de tema
- `hooks/useTheme.ts` - Hook para gerenciar tema
- `contexts/ThemeContext.tsx` - Context de tema
- `app/api/users/theme/route.ts` - Salvar preferência no banco

#### Variáveis CSS:
```css
:root {
  /* Dark mode (default) */
  --bg-primary: #000000;
  --bg-secondary: #121212;
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f4f4f5;
  --text-primary: #18181b;
  --text-secondary: #71717a;
}
```

---

### 8. Melhorias de Performance

**Prioridade:** Alta
**Complexidade:** Média
**Estimativa:** 3-4 dias

#### Features:

#### 8.1 Lazy Loading de Imagens
- Usar Next/Image com `loading="lazy"` em todas as imagens
- Placeholder blur enquanto carrega
- Otimização automática de tamanho
- Servir WebP quando suportado

#### 8.2 Infinite Scroll
- Substituir paginação tradicional por infinite scroll
- Implementar em:
  - `/news` - Lista de notícias
  - `/artists` - Lista de artistas
  - `/productions` - Lista de produções
- Usar Intersection Observer API
- Skeleton loader ao carregar mais itens
- Botão "Carregar mais" como fallback

#### 8.3 Prefetch de Páginas Relacionadas
- Prefetch de links visíveis no viewport
- Usar Next.js Link com prefetch automático
- Cache inteligente de dados

#### 8.4 Otimização de Fontes
- Usar `next/font` para carregar fontes localmente
- Subset de fontes (apenas caracteres necessários)
- Font display: swap para evitar FOIT

#### Arquivos a criar:
- `components/ui/InfiniteScroll.tsx` - Componente de infinite scroll
- `hooks/useInfiniteScroll.ts` - Hook para gerenciar infinite scroll
- `hooks/useIntersectionObserver.ts` - Hook para Intersection Observer

#### Otimizações a implementar:
```typescript
// app/layout.tsx
import { Inter, Outfit } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit'
})
```

---

## 📊 Matriz de Priorização

| Feature | Prioridade | Complexidade | Impacto UX | Esforço (dias) |
|---------|-----------|--------------|-----------|----------------|
| Sistema de Likes | Alta | Média | Alto | 2-3 |
| Página de Perfil | Alta | Alta | Muito Alto | 4-5 |
| Modo Cards/Lista | Média | Baixa | Médio | 1-2 |
| Busca Global | Alta | Alta | Muito Alto | 5-6 |
| Melhorias Homepage | Alta | Média | Alto | 3-4 |
| Notificações In-App | Média | Alta | Alto | 5-6 |
| Light Mode | Média | Média | Alto | 3-4 |
| Performance | Alta | Média | Muito Alto | 3-4 |

---

## 🎯 Sugestão de Ordem de Implementação

### Sprint 1 (Quick Wins - 5-7 dias)
1. **Modo Cards/Lista** (1-2 dias) - Baixa complexidade, impacto imediato
2. **Sistema de Likes** (2-3 dias) - Engajamento do usuário
3. **Performance: Lazy Loading** (2 dias) - Melhora experiência imediata

### Sprint 2 (High Impact - 8-10 dias)
4. **Busca Global** (5-6 dias) - Feature mais requisitada
5. **Melhorias Homepage** (3-4 dias) - Primeira impressão do site

### Sprint 3 (User Engagement - 9-11 dias)
6. **Página de Perfil** (4-5 dias) - Retenção de usuários
7. **Notificações In-App** (5-6 dias) - Engajamento recorrente

### Sprint 4 (Polish - 6-8 dias)
8. **Light Mode** (3-4 dias) - Acessibilidade e preferência
9. **Performance: Infinite Scroll + Prefetch** (3-4 dias) - UX refinamento

---

## 📝 Notas de Implementação

### Boas Práticas a Seguir:
- ✅ Sempre criar testes para novas features
- ✅ Documentar componentes complexos
- ✅ Manter consistência com design system existente
- ✅ Validar acessibilidade (a11y)
- ✅ Testar em mobile antes de fazer merge
- ✅ Usar TypeScript strict mode
- ✅ Seguir padrões de commits semânticos
- ✅ Criar migrations reversíveis no Prisma

### Checklist para Cada Feature:
- [ ] Design/mockup aprovado
- [ ] Schema Prisma atualizado (se necessário)
- [ ] API endpoints criados e testados
- [ ] Componentes UI implementados
- [ ] Integração front-back funcionando
- [ ] Testes unitários criados
- [ ] Testes e2e para fluxos críticos
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Deploy em staging
- [ ] Validação em staging
- [ ] Deploy em production

---

## 🔗 Recursos e Referências

### Design Inspiration:
- [Soompi](https://www.soompi.com/) - Layout de notícias K-pop
- [MyDramaList](https://mydramalist.com/) - Sistema de reviews e perfis
- [Koreaboo](https://www.koreaboo.com/) - Grid de artigos e trending

### Libraries Recomendadas:
- **Carrossel:** `embla-carousel-react` ou `swiper`
- **Infinite Scroll:** `react-intersection-observer`
- **Notificações Toast:** `react-hot-toast` (já usado?)
- **Animações:** `framer-motion` (já usado ✅)
- **Formatação de Datas:** `date-fns` (já usado ✅)

### Performance Tools:
- Lighthouse CI
- Next.js Analytics
- Vercel Speed Insights
- Web Vitals

---

**Última atualização:** 11 de Fevereiro de 2026
**Mantido por:** Fabio Uchidate + Claude Sonnet 4.5
