# 📰 Roadmap - Sistema de Notícias

Plano de melhorias incrementais para o sistema de notícias do HallyuHub.

## ✅ Implementado (Sprint 1 & 2)

- [x] **RSS Fetching** - Busca de 3 fontes (Soompi, Koreaboo, KpopStarz)
- [x] **UPSERT automático** - Prevenção de duplicatas via sourceUrl @unique
- [x] **News ↔ Artist** - Associação many-to-many com artistas
- [x] **Feed personalizado** - Filtragem baseada em artistas favoritos do usuário
- [x] **Admin CRUD** - Gerenciamento completo via `/admin/news`
- [x] **Extração automática** - Via cron a cada hora com NER (Named Entity Recognition)
- [x] **Página de detalhes** - `/news/[id]` com artistas mencionados
- [x] **Grupos K-pop** - Detecção de BTS, BLACKPINK, Stray Kids, TXT, etc.

---

## 📋 Backlog - Features Planejadas

### 🎯 Prioridade ALTA (UX Core)

#### 1. 🔍 Busca de Notícias
**Objetivo**: Permitir usuários pesquisarem notícias por palavra-chave

**Escopo**:
- [ ] Endpoint `/api/news/search?q={query}`
- [ ] Busca em `title`, `contentMd`, `tags`
- [ ] Busca por nome de artista
- [ ] UI: Barra de pesquisa na página `/news`
- [ ] Highlight de termos encontrados
- [ ] Filtros combinados (busca + artista + data)

**Estimativa**: 4-6 horas

---

#### 2. 🏷️ Filtros Avançados
**Objetivo**: Filtrar notícias por múltiplos critérios

**Escopo**:
- [ ] Filtro por artista/grupo
- [ ] Filtro por período (hoje, semana, mês, customizado)
- [ ] Filtro por fonte (Soompi, Koreaboo, etc.)
- [ ] Filtro por tags (quando implementado tagging)
- [ ] UI: Sidebar com checkboxes/dropdowns
- [ ] Query params: `?artist=X&source=Y&from=Z&to=W`
- [ ] "Limpar filtros" button

**Estimativa**: 6-8 horas

---

#### 3. ⭐ Trending/Popular News
**Objetivo**: Destacar notícias mais populares

**Escopo**:
- [ ] Adicionar campos `viewCount`, `favoriteCount` à tabela `News`
- [ ] Endpoint `/api/news/trending`
- [ ] Algoritmo de trending: `score = (views * 0.3) + (favorites * 0.7) / age_hours`
- [ ] UI: Seção "Trending" no topo da página `/news`
- [ ] Cache de 15min para lista de trending
- [ ] Tracking de views (increment on page visit)

**Estimativa**: 5-7 horas

---

#### 4. 🔗 Notícias Relacionadas
**Objetivo**: Sugerir notícias similares

**Escopo**:
- [ ] Algoritmo de similaridade:
  - Artistas em comum (peso 50%)
  - Tags em comum (peso 30%)
  - Mesma fonte (peso 10%)
  - Proximidade temporal (peso 10%)
- [ ] Endpoint `/api/news/[id]/related`
- [ ] UI: "Notícias Relacionadas" na página `/news/[id]`
- [ ] Limite de 5 notícias relacionadas
- [ ] Cache de 1h

**Estimativa**: 4-6 horas

---

### 🔥 Prioridade MÉDIA (Engagement)

#### 5. 🔔 Notificações Push
**Objetivo**: Alertar usuários quando artistas favoritos aparecem em notícias

**Escopo**:
- [ ] Implementar Web Push API
- [ ] Tabela `UserNotification` no banco
- [ ] Trigger ao criar `NewsArtist` (se usuário tem artista como favorito)
- [ ] Configurações de notificação no perfil do usuário
- [ ] Batch notifications (não enviar a cada notícia, agrupar)
- [ ] UI: Modal de permissão, toggle de on/off
- [ ] Email digest diário (alternativa ao push)

**Estimativa**: 10-12 horas

---

#### 6. 💬 Comentários e Reações
**Objetivo**: Permitir interação dos usuários com as notícias

**Escopo**:
- [ ] Tabela `NewsComment` (userId, newsId, content, createdAt)
- [ ] Tabela `NewsReaction` (userId, newsId, type: 'like'|'love'|'wow')
- [ ] Endpoints CRUD para comentários
- [ ] Endpoints para reações (toggle like)
- [ ] UI: Seção de comentários em `/news/[id]`
- [ ] Moderação básica (admin pode deletar)
- [ ] Rate limiting (max 10 comentários/hora por usuário)

**Estimativa**: 12-15 horas

---

#### 7. 📤 Social Sharing
**Objetivo**: Facilitar compartilhamento de notícias

**Escopo**:
- [ ] Botões de share: Twitter, Facebook, WhatsApp, Copiar link
- [ ] Open Graph meta tags otimizadas
- [ ] Twitter Card meta tags
- [ ] Preview de link bonito (título, imagem, descrição)
- [ ] Tracking de shares (analytics)
- [ ] UI: Botões no topo e rodapé de `/news/[id]`

**Estimativa**: 3-4 horas

---

### 🛠️ Prioridade BAIXA (Técnicas/Otimizações)

#### 8. 🖼️ Otimização de Imagens
**Objetivo**: Melhorar performance de carregamento

**Escopo**:
- [ ] Migrar `<img>` → `<Image>` (next/image)
- [ ] Configurar image domains permitidos
- [ ] Lazy loading automático
- [ ] Placeholder blur
- [ ] Considerar CDN (Cloudflare Images / Vercel Image Optimization)
- [ ] Fallback image para notícias sem imagem

**Estimativa**: 3-5 horas

---

#### 9. 🌐 Tradução Automática
**Objetivo**: Traduzir notícias de inglês para português

**Escopo**:
- [ ] Adicionar campo `contentPt` à tabela `News`
- [ ] Serviço de tradução (OpenAI GPT-4 ou DeepL API)
- [ ] Tradução assíncrona (job queue)
- [ ] Toggle EN/PT na UI
- [ ] Cache de traduções
- [ ] Budget control (não traduzir tudo, só sob demanda)

**Estimativa**: 8-10 horas

**Custo**: ~$0.01 por notícia (GPT-4) ou ~$0.20/500k chars (DeepL)

---

#### 10. 📊 SEO & Meta Tags
**Objetivo**: Melhorar indexação e compartilhamento

**Escopo**:
- [ ] Metadata dinâmica em `/news/[id]`
- [ ] Open Graph tags completas
- [ ] Twitter Card tags
- [ ] Schema.org JSON-LD (NewsArticle)
- [ ] Sitemap XML para `/news/*`
- [ ] Robots.txt otimizado
- [ ] Canonical URLs

**Estimativa**: 4-5 horas

---

## 📈 Roadmap Sugerido (Ordem de Implementação)

### Sprint 3 - Descoberta e Navegação
1. 🔍 Busca de Notícias (4-6h)
2. 🏷️ Filtros Avançados (6-8h)
3. 🖼️ Otimização de Imagens (3-5h)

**Total Sprint 3**: ~15-20 horas

---

### Sprint 4 - Engajamento
1. ⭐ Trending/Popular News (5-7h)
2. 🔗 Notícias Relacionadas (4-6h)
3. 📤 Social Sharing (3-4h)

**Total Sprint 4**: ~12-17 horas

---

### Sprint 5 - Interação Avançada
1. 🔔 Notificações Push (10-12h)
2. 💬 Comentários e Reações (12-15h)

**Total Sprint 5**: ~22-27 horas

---

### Sprint 6 - Polimento
1. 📊 SEO & Meta Tags (4-5h)
2. 🌐 Tradução Automática (8-10h) - *Opcional, avaliar custo*

**Total Sprint 6**: ~12-15 horas

---

## 🎯 Métricas de Sucesso

Após cada sprint, medir:
- **Engagement**: Tempo médio na página, taxa de cliques
- **Uso**: % de usuários usando busca/filtros
- **Performance**: Tempo de carregamento, Core Web Vitals
- **Retenção**: Usuários que voltam para ler notícias
- **Conversão**: Usuários que favoritam artistas após ler notícias

---

## 📝 Notas

- **Priorizar UX** antes de features avançadas
- **Medir impacto** de cada feature antes de prosseguir
- **Iterar baseado em feedback** real de usuários
- **Manter simplicidade** - não over-engineer

---

**Última atualização**: 2026-02-11
**Status**: Sprint 1 & 2 concluídos ✅
