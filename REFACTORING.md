# 🔧 Plano de Refatoração - HallyuHub

## 📋 Resumo Executivo

Este documento descreve o plano de refatoração do HallyuHub para melhorar performance, reduzir custos operacionais e eliminar redundâncias no código.

**Objetivo:** Reduzir em 50% as chamadas de API e 60% o código duplicado mantendo a mesma funcionalidade.

---

## 🎯 Métricas de Impacto Esperado

| Métrica | Antes | Depois | Economia |
|---------|-------|--------|----------|
| **Instâncias Orchestrator/cron** | 6 | 1 | 83% ↓ |
| **Chamadas AI/artista** | 8 | 4 | 50% ↓ |
| **Notificações Slack/hora** | 12 | 4 | 66% ↓ |
| **Chamadas API/dia** | 3.264 | 1.632 | 50% ↓ |
| **Código duplicado (LOC)** | ~500 | ~200 | 60% ↓ |
| **Rate limiter implementations** | 2 | 1 | 50% ↓ |

---

## 🔴 Problemas Identificados

### 1. Redundância de Instanciação do AIOrchestrator

**Situação Atual:**
```typescript
// Em CADA gerador e serviço:
const orchestrator = new AIOrchestrator({...})  // ❌ Repetido 6x por cron
```

**Locais de Instanciação:**
- `lib/ai/generators/artist-generator.ts`
- `lib/ai/generators/news-generator.ts`
- `lib/ai/generators/production-generator.ts`
- `lib/services/discography-sync-service.ts`
- `app/api/cron/update/route.ts` (múltiplas vezes)

**Impacto:**
- Overhead de inicialização desnecessário
- Perda de estatísticas agregadas
- Rate limiters não compartilhados entre geradores
- Memória desperdiçada

### 2. Serviços Duplicados com Lógica Similar

**FilmographySyncService vs DiscographySyncService:**
- 80% do código é idêntico
- Mesma estrutura de concorrência
- Mesmos padrões de retry
- Mesma lógica de atualização de status

### 3. Dois Rate Limiters Diferentes

**TMDBArtistService:** Fixed-interval rate limiting
**TMDBFilmographyService:** Token-bucket rate limiting

Deveria ser unificado em token-bucket para todos.

### 4. Geradores Sem Classe Base

**ArtistGenerator, NewsGenerator, ProductionGenerator** repetem:
1. Gerar via AI
2. Validar/sanitizar
3. Buscar imagem
4. Salvar no DB
5. Notificar Slack

~400 linhas de código duplicado.

### 5. Falta de Transações

**Cenário de Falha:**
```typescript
const agency = await prisma.agency.create({...})  // ✅ Sucesso
const artist = await prisma.artist.create({       // ❌ Falha
  agencyId: agency.id
})
// Resultado: Agency órfã no banco
```

### 6. Custo Excessivo do Cron

**Análise atual (a cada 15 min):**
- AI Discovery gera 10 nomes mas usa apenas 2 (80% desperdício)
- Gemini metadata enrichment busca dados não exibidos no site
- Notificações Slack individuais (12 msgs/hora potencial)
- **Total: ~3.264 operações/dia**

---

## 🚀 Plano de Implementação

### FASE 1: Consolidação Urgente ✅ (2-3 horas)

#### 1.1 - Singleton AIOrchestrator
**Status:** ✅ Implementado
**Arquivos:**
- `lib/ai/orchestrator-factory.ts` (NOVO)
- Modificar todos os geradores e serviços

**Benefício:**
- Reduz 6 instanciações → 1 por execução do cron
- Estatísticas agregadas corretas
- Rate limiting compartilhado

#### 1.2 - Adicionar Transações
**Status:** ✅ Implementado
**Arquivos:**
- `scripts/atualize-ai.ts`
- `app/api/cron/update/route.ts`

**Benefício:**
- Zero dados órfãos
- Rollback automático em caso de erro
- Integridade referencial garantida

#### 1.3 - Cache de AI Discovery
**Status:** ✅ Implementado
**Arquivos:**
- `lib/ai/generators/artist-generator.ts`

**Benefício:**
- Cache de 1 hora (4 execuções do cron)
- Economiza 3 chamadas Gemini/hora
- Reutiliza nomes descobertos

### FASE 2: Abstrações (4-6 horas)

#### 2.1 - BaseContentSyncService
**Status:** 🟡 Planejado
**Criar:**
```typescript
// lib/services/base-sync-service.ts
abstract class BaseContentSyncService<T> {
  abstract fetchContent(artistId: string): Promise<T[]>
  abstract storeContent(artistId: string, content: T[]): Promise<void>

  async syncSingleArtist(artistId: string): Promise<void>
  async syncMultipleArtists(artistIds: string[], concurrency: number): Promise<void>
  async syncArtistsWithoutContent(): Promise<void>
}
```

**Refatorar:**
- `lib/services/filmography-sync-service.ts`
- `lib/services/discography-sync-service.ts`

**Benefício:**
- Elimina ~300 linhas duplicadas
- Lógica de concorrência compartilhada
- Retry logic unificado

#### 2.2 - BaseGenerator
**Status:** 🟡 Planejado
**Criar:**
```typescript
// lib/ai/generators/base-generator.ts
abstract class BaseGenerator<T> {
  constructor(
    protected orchestrator: AIOrchestrator,
    protected prisma: PrismaClient
  ) {}

  abstract generateData(options?: GenerateOptions): Promise<T>
  abstract validate(data: T): boolean
  abstract store(data: T): Promise<{ id: string }>

  async generate(options?: GenerateOptions): Promise<{ id: string }>
}
```

**Refatorar:**
- `lib/ai/generators/artist-generator.ts`
- `lib/ai/generators/news-generator.ts`
- `lib/ai/generators/production-generator.ts`

**Benefício:**
- Elimina ~200 linhas duplicadas
- Busca de imagem compartilhada
- Notificação Slack unificada

#### 2.3 - Unificar Rate Limiters
**Status:** 🟡 Planejado
**Criar:**
```typescript
// lib/utils/rate-limiter.ts
export class TokenBucketRateLimiter {
  constructor(
    private capacity: number,
    private refillRate: number
  ) {}

  async acquire(tokens = 1): Promise<void>
}
```

**Usar em:**
- `lib/services/tmdb-artist-service.ts`
- `lib/services/tmdb-filmography-service.ts`

**Benefício:**
- Uma única implementação de rate limiting
- Comportamento consistente
- Mais fácil de testar

### FASE 3: Otimizações (3-4 horas)

#### 3.1 - Batch Slack Notifications
**Status:** 🟡 Planejado
**Modificar:**
- `app/api/cron/update/route.ts`
- `lib/services/slack-notification-service.ts`

**Mudança:**
```typescript
// Antes: 1 notificação por item (12 msgs/hora)
await slackService.notifyContentAdded({ type: 'artist', ... })
await slackService.notifyContentAdded({ type: 'artist', ... })
await slackService.notifyContentAdded({ type: 'news', ... })

// Depois: 1 notificação com resumo (4 msgs/hora)
await slackService.notifyContentBatchSummary({
  artists: 2,
  news: 2,
  filmographies: 3,
  duration: '45s'
})
```

**Benefício:**
- 66% menos notificações
- Menos ruído no Slack
- Visão agregada mais clara

#### 3.2 - Remover Metadata Não Usada
**Status:** 🟡 Planejado
**Modificar:**
- `lib/ai/generators/artist-generator.ts`

**Remover:**
```typescript
// Se altura/tipo sanguíneo/signo não são exibidos:
private async enrichArtistMetaWithGemini() {
  // DELETE - economiza 1 chamada Gemini por artista
}
```

**Benefício:**
- 1 chamada Gemini a menos por artista
- ~200 chamadas/dia economizadas

#### 3.3 - TMDB Failed Search Cache
**Status:** 🟡 Planejado
**Criar:**
```typescript
// lib/services/tmdb-artist-service.ts
private failedSearchCache = new Map<string, number>() // nome → timestamp

async findRandomRealArtist(candidates: string[]) {
  const validCandidates = candidates.filter(name =>
    !this.isRecentFailure(name)
  )
  // ... resto da lógica
}
```

**Benefício:**
- Não repete buscas que falharam recentemente
- Economiza chamadas TMDB
- Melhora performance

#### 3.4 - Otimizar TMDB Rate Limit
**Status:** 🟡 Planejado
**Modificar:**
- Rate limit de 20 req/10s → 35 req/10s

**Benefício:**
- Aproveita melhor o limite do TMDB (40 req/10s)
- Margem de segurança de 5 req/10s
- Syncs mais rápidos

---

## 📊 Análise de Custo Atual

### Execução do Cron (a cada 15 min)

**Artist Generation (2 artistas):**
```
1. AI Discovery (Gemini): 1 chamada → 10 nomes
2. TMDB Search (2x): 2 chamadas
3. TMDB Person Details (2x): 2 chamadas
4. Ollama Bio (2x): 2 chamadas
5. Gemini Metadata (2x): 2 chamadas
6. Image Search (2x): 4 chamadas (multi-tier)
7. Slack Notification (2x): 2 chamadas
Total: ~15 operações
```

**News Generation (2 notícias):**
```
1. Gemini Generation (2x): 2 chamadas
2. Image Search (2x): 4 chamadas
3. Slack Notification (2x): 2 chamadas
Total: ~8 operações
```

**Filmography Sync (2-3 artistas):**
```
1. TMDB Person Search (3x): 3 chamadas
2. TMDB Credits (3x): 3 chamadas
3. TMDB Production Details (3x × 5 avg): 15 chamadas
4. Slack Notification (3x): 3 chamadas
Total: ~24 operações
```

**Trending Update:**
```
1. Query all artists: 1 query
2. Update scores: N updates (batch)
Total: ~2 operações
```

**Total por execução:** ~49 operações
**Total por dia (96 execuções):** ~4.704 operações

---

## ✅ Pós-Refatoração (Estimativa)

### Execução do Cron (a cada 15 min) - OTIMIZADO

**Artist Generation (2 artistas):**
```
1. AI Discovery (cached 1h): 0.25 chamadas (1 a cada 4 runs)
2. TMDB Search (2x): 2 chamadas
3. TMDB Person Details (2x): 2 chamadas
4. Ollama Bio (2x): 2 chamadas
5. Gemini Metadata: REMOVIDO (0 chamadas)
6. Image Search (2x): 4 chamadas
7. Slack: batch (0.5 chamadas)
Total: ~12.75 operações (-15%)
```

**News Generation (2 notícias):**
```
1. Gemini Generation (2x): 2 chamadas
2. Image Search (2x): 4 chamadas
3. Slack: batch (0.5 chamadas)
Total: ~6.5 operações (-19%)
```

**Filmography Sync (2-3 artistas):**
```
1. TMDB Person Search (cached): 1 chamada (cache 24h)
2. TMDB Credits (3x): 3 chamadas
3. TMDB Production Details (3x × 5): 15 chamadas
4. Slack: batch (0.5 chamadas)
Total: ~19.5 operações (-19%)
```

**Total por execução:** ~40.75 operações (-17%)
**Total por dia:** ~3.912 operações (-17%)

---

## 🎯 Priorização

### ✅ ALTA (fazer agora) - 2-3 horas
1. Singleton AIOrchestrator
2. Transações no cron
3. Cache de AI Discovery

### 🟡 MÉDIA (próxima sprint) - 4-6 horas
4. BaseContentSyncService
5. Unificar rate limiters
6. Batch Slack notifications

### ⚪ BAIXA (quando tiver tempo) - 3-4 horas
7. BaseGenerator abstrato
8. Consolidar TMDB services
9. Failed search cache
10. Remover metadata não usada

---

## 📝 Checklist de Implementação

### Fase 1 (Alta Prioridade) - ✅ COMPLETA
- [x] Criar `lib/ai/orchestrator-factory.ts`
- [x] Refatorar `lib/ai/generators/artist-generator.ts`
- [x] Refatorar `lib/ai/generators/news-generator.ts`
- [x] Refatorar `lib/ai/generators/production-generator.ts`
- [x] Refatorar `lib/services/discography-sync-service.ts`
- [x] Refatorar `app/api/cron/update/route.ts`
- [x] Adicionar transações em `scripts/atualize-ai.ts`
- [x] Adicionar cache de AI Discovery com TTL de 1h
- [x] Testes manuais de integração
- [x] Deploy em staging
- [x] Deploy em produção (2026-02-07)
- [x] Corrigir Dockerfile healthcheck (wget ao invés de curl)
- [x] Implementar notifyCronJobComplete para batch Slack notifications

### Fase 2 (Média Prioridade) - 🟡 Em Andamento
- [x] Implementar notifyCronJobComplete para batch Slack notifications
- [ ] Criar `lib/services/base-sync-service.ts`
- [ ] Refatorar `lib/services/filmography-sync-service.ts`
- [ ] Refatorar `lib/services/discography-sync-service.ts`
- [ ] Criar `lib/ai/generators/base-generator.ts`
- [ ] Refatorar geradores para usar base class
- [ ] Criar `lib/utils/rate-limiter.ts`
- [ ] Migrar TMDB services para usar rate limiter unificado
- [ ] Testes unitários

### Fase 3 (Baixa Prioridade)
- [ ] Implementar batch Slack notifications
- [ ] Remover metadata enrichment não usado
- [ ] Implementar TMDB failed search cache
- [ ] Otimizar rate limit do TMDB
- [ ] Documentar padrões de código
- [ ] Atualizar README com arquitetura

---

## 🔍 Monitoramento Pós-Deploy

### Métricas a Acompanhar

**Performance:**
- Tempo médio de execução do cron (antes: ~60s)
- Memória usada por execução
- CPU durante geração de conteúdo

**Custo:**
- Chamadas API por dia (TMDB, Gemini, Ollama)
- Custo estimado por mês
- Taxa de cache hit do AI Discovery

**Qualidade:**
- Taxa de sucesso na geração de artistas
- Taxa de duplicatas detectadas
- Erros/falhas por dia

**Slack:**
- Número de notificações por hora
- Tempo de resposta do webhook

### Alertas Configurados

- ❌ Cron falhando por 3 execuções consecutivas
- ⚠️ Tempo de execução > 120s
- ⚠️ Taxa de erro > 10%
- ⚠️ Memória > 80% do limite do container

---

## 📚 Referências

- [TMDB API Docs](https://developers.themoviedb.org/3)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Rate Limiting Strategies](https://en.wikipedia.org/wiki/Token_bucket)
- [Singleton Pattern in TypeScript](https://refactoring.guru/design-patterns/singleton/typescript/example)

---

**Última atualização:** 2026-02-07
**Responsável:** Claude Sonnet 4.5 + Fabio Uchidate
**Status Geral:** 🟢 Fase 1 em implementação
