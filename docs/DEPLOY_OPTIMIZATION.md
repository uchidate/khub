# 🚀 Otimizações de Deploy - HallyuHub

## 📊 Análise Atual

### Tempos Médios (Baseline)
- **Build Docker Image**: ~8-12 minutos
- **Deploy Staging**: ~5-7 minutos
- **Deploy Production**: ~6-8 minutos
- **Total (staging → production)**: ~20-25 minutos

### Gargalos Identificados
1. ❌ **Dockerfile**: `prisma generate` roda 2x (deps + builder)
2. ❌ **Dockerfile**: `npm install` completo no deps (inclui dev deps desnecessários)
3. ❌ **GitHub Actions**: `validate-code` faz build completo que é descartado
4. ❌ **GitHub Actions**: `npm ci` roda 2x (validate + Docker build)
5. ❌ **Deploy**: Health check espera 5s entre tentativas (pode ser 2s)
6. ❌ **Docker Image**: 350MB+ (pode reduzir para ~250MB)

---

## 🎯 Otimizações Propostas

### ✅ **PRIORIDADE ALTA** (Ganho: 40-60% tempo total)

#### 1. Dockerfile Otimizado

**Mudanças:**
- ✅ `prisma generate` roda **UMA vez** (deps stage)
- ✅ Deps stage usa `npm ci --only=production` (mais rápido)
- ✅ Build deps separado (melhor cache de layers)
- ✅ Runner stage copia node_modules de produção (menor imagem)
- ✅ Ordem de COPY otimizada para aprovei tar cache

**Ganho estimado:** 3-5 minutos no build

```dockerfile
# Antes: deps instala tudo, builder regenera prisma
FROM node:20-bullseye-slim AS deps
RUN npm install
COPY prisma ./prisma/
# ... builder stage refaz prisma generate

# Depois: deps produção + prisma UMA vez
FROM node:20-bullseye-slim AS deps
RUN npm ci --only=production --ignore-scripts
COPY prisma ./prisma/
RUN npx prisma generate  # UMA VEZ

FROM node:20-bullseye-slim AS build-deps
RUN npm ci --ignore-scripts  # Dev deps separado

FROM node:20-bullseye-slim AS builder
COPY --from=build-deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
# Não roda prisma generate novamente!
```

#### 2. GitHub Actions: Remover Build Duplicado

**Mudanças:**
- ❌ Remover `npm run build` do `validate-code` job
- ✅ Manter apenas ESLint + TypeScript typecheck
- ✅ Build real acontece no Docker (mais eficiente)

**Ganho estimado:** 2-3 minutos no validation

```yaml
# Antes: validate faz build completo (descartado)
validate-code:
  steps:
    - run: npm ci
    - run: npx prisma generate
    - run: npx eslint app/ lib/
    - run: npx tsc --noEmit
    - run: npm run build  # ❌ Descartado, Docker refaz!

# Depois: apenas lint + typecheck
validate-code:
  steps:
    - run: npm ci
    - run: npx prisma generate
    - run: npx eslint app/ lib/
    - run: npx tsc --noEmit
    # Build removido! Docker faz uma vez só
```

#### 3. BuildKit Cache Inline

**Mudanças:**
- ✅ Ativar `DOCKER_BUILDKIT=1`
- ✅ Usar `--cache-from` e `--cache-to` com GitHub Actions cache
- ✅ `BUILDKIT_INLINE_CACHE=1` no build-args

**Ganho estimado:** 1-2 minutos (cache hits)

```yaml
# Já está implementado parcialmente, melhorar:
build-image:
  steps:
    - uses: docker/build-push-action@v5
      with:
        cache-from: type=gha
        cache-to: type=gha,mode=max  # mode=max é crucial!
        build-args: |
          BUILDKIT_INLINE_CACHE=1
```

---

### ✅ **PRIORIDADE MÉDIA** (Ganho: 20-30% tempo total)

#### 4. Otimizar Health Checks

**Mudanças:**
- ✅ Reduzir interval de 5s → 2s
- ✅ Reduzir max_retries (20 → 15)
- ✅ Dockerfile healthcheck: 30s → 20s interval

**Ganho estimado:** 30-60 segundos no deploy

```bash
# Antes: aguarda 5s entre tentativas
max_retries=20
sleep 5

# Depois: aguarda 2s (mais ágil)
max_retries=15
sleep 2
```

#### 5. Cache de node_modules entre Runs

**Mudanças:**
- ✅ Adicionar cache de `node_modules` no validation job
- ✅ Usar hash do package-lock.json como key

**Ganho estimado:** 30-60 segundos no npm ci

```yaml
- name: Cache node_modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

#### 6. Reduzir Tamanho do Runner Stage

**Mudanças:**
- ✅ Remover mais build deps desnecessários
- ✅ Analisar com `npx depcheck`
- ✅ Imagem final: 350MB → 250MB

**Ganho estimado:** 20-30 segundos no push/pull

---

### ✅ **PRIORIDADE BAIXA** (Ganho: 5-10% tempo total)

#### 7. Consolidar Notificações Slack

**Mudanças:**
- ✅ Notificar apenas início + conclusão (remover intermediárias)
- ✅ Consolidar em uma única mensagem com thread

**Ganho estimado:** 5-10 segundos (menos requests)

#### 8. Skip Migrations Quando Desnecessário

**Mudanças:**
- ✅ Verificar `prisma migrate status` ANTES de aplicar
- ✅ Se "Database schema is up to date", skippar

**Ganho estimado:** 10-20 segundos quando não há migrations

---

## 📈 Ganhos Esperados

### Cenário Conservador (40%)
- **Build Docker Image**: 8-12min → **5-7min** (-3-5min)
- **Deploy Staging**: 5-7min → **3-5min** (-2min)
- **Deploy Production**: 6-8min → **4-6min** (-2min)
- **Total**: 20-25min → **12-18min** (-8-10min)

### Cenário Otimista (60%)
- **Build Docker Image**: 8-12min → **3-5min** (-5-7min)
- **Deploy Staging**: 5-7min → **2-4min** (-3min)
- **Deploy Production**: 6-8min → **3-5min** (-3min)
- **Total**: 20-25min → **8-14min** (-12-15min)

---

## 🛠️ Plano de Implementação

### Fase 1: Otimizações de Alto Impacto (Prioridade 1)
1. ✅ Substituir `Dockerfile` pelo `Dockerfile.optimized`
2. ✅ Atualizar `.github/workflows/deploy.yml` (remover build do validate)
3. ✅ Testar em staging primeiro
4. ✅ Monitorar tempos e ajustar

### Fase 2: Otimizações de Médio Impacto (Prioridade 2)
1. ✅ Adicionar cache de node_modules
2. ✅ Otimizar health checks
3. ✅ Reduzir tamanho do runner stage

### Fase 3: Ajustes Finos (Prioridade 3)
1. ✅ Consolidar notificações
2. ✅ Skip migrations inteligente

---

## 🧪 Como Testar

### 1. Testar Dockerfile Otimizado Localmente

```bash
# Build com o Dockerfile otimizado
docker build -f Dockerfile.optimized -t hallyuhub:test .

# Comparar tamanho
docker images | grep hallyuhub

# Testar runtime
docker run -p 3000:3000 --env-file .env.local hallyuhub:test
```

### 2. Comparar Tempos de Build

```bash
# Antes (baseline)
time docker build -t hallyuhub:baseline .

# Depois (otimizado)
time docker build -f Dockerfile.optimized -t hallyuhub:optimized .

# Diferença esperada: 40-60% mais rápido
```

### 3. Validar no CI

```bash
# Push para staging
git checkout staging
git add Dockerfile.optimized .github/workflows/deploy.yml
git commit -m "perf: optimize Docker build and deploy pipeline"
git push origin staging

# Monitorar tempo no GitHub Actions
gh run list --workflow=deploy.yml --limit 1 --json startedAt,updatedAt,conclusion
```

---

## ⚠️ Riscos e Mitigações

### Risco 1: Prisma Client Não Gerado Corretamente
**Mitigação:** Testar localmente antes do push, validar que `.prisma/client` existe no runner stage

### Risco 2: Build Deps Faltando no Runner
**Mitigação:** Copiar apenas `node_modules/.prisma` e `node_modules/@prisma` explicitamente

### Risco 3: Cache Inválido
**Mitigação:** Usar `mode=max` no cache-to, invalidar cache com `docker builder prune -af`

### Risco 4: Features Quebradas
**Mitigação:** Testar TODAS as features em staging antes de merge para main

---

## 📝 Checklist de Validação

Após implementar as otimizações, validar:

- [ ] ✅ Site carrega em staging/production
- [ ] ✅ Autenticação funciona (NextAuth)
- [ ] ✅ Banco de dados conecta (Prisma)
- [ ] ✅ Ollama/Gemini funcionam (AI providers)
- [ ] ✅ TMDB/Unsplash funcionam (External APIs)
- [ ] ✅ Cron jobs rodam (auto-update content)
- [ ] ✅ Health check passa
- [ ] ✅ SSL válido (production)
- [ ] ✅ Logs sem erros críticos
- [ ] ✅ Tempo de deploy reduzido em 40-60%

---

## 📊 Métricas de Sucesso

### KPIs
- **Build Time Reduction**: -40% a -60%
- **Image Size Reduction**: -100MB (-30%)
- **Deploy Time Reduction**: -8 a -15 minutos
- **Cache Hit Rate**: >70% (GitHub Actions cache)

### Monitoramento
```bash
# Tempo de build (GitHub Actions)
gh run view <run-id> --json timing

# Tamanho da imagem
docker images ghcr.io/uchidate/khub:latest --format "{{.Size}}"

# Cache hits (Docker Buildx)
docker buildx du --verbose
```

---

## 🔗 Referências

- [Docker Multi-Stage Builds Best Practices](https://docs.docker.com/build/building/multi-stage/)
- [GitHub Actions Cache](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Docker BuildKit Cache](https://docs.docker.com/build/cache/)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-client-transactions-guide)
