# 🔧 Melhorias Recomendadas - HallyuHub

Análise completa do projeto com sugestões práticas de melhorias.

---

## 📊 Status Atual do Projeto

**Pontuação Geral:** ⭐⭐⭐ (3/5)

**Pontos Fortes:**
- ✅ CI/CD implementado com GitHub Actions
- ✅ Documentação recente criada
- ✅ Scripts de automação robustos
- ✅ Deploy automatizado funcional

**Pontos Fracos:**
- ❌ Estrutura duplicada (root vs v1)
- ❌ Docker pesado e sem healthcheck
- ❌ SQLite limitado para produção
- ❌ API keys expostas em .env
- ❌ Sem testes automatizados

---

## 🚨 CRÍTICO - Corrija Imediatamente

### 1. **Segurança: API Keys Expostas** 🔴

**Problema:**
```bash
# v1/.env está commitado com chave pública
GEMINI_API_KEY=AIzaSyCeAhim6T2XZQfXy2F1c6Y7y8OVOoh5-_g
```

**Solução Imediata:**
```bash
# 1. Regenerar a chave no Google Cloud Console
# 2. Adicionar v1/.env ao .gitignore
echo "v1/.env" >> .gitignore

# 3. Remover do histórico do Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch v1/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Usar apenas .env.example
cp v1/.env v1/.env.local
git rm --cached v1/.env
```

**Prevenção:**
- Use GitHub Secrets para produção
- Configure pre-commit hooks para detectar secrets
- Use ferramentas como `trufflehog` ou `gitleaks`

---

### 2. **Estrutura: Consolidar v1 como Produção** 🔴

**Problema:**
- Duplicação: root tem `app/`, `prisma/`, `docker/`
- v1/ também tem tudo isso
- v2/ está vazio (apenas README)
- Confusão sobre qual é produção

**Solução:**

```bash
# Estrutura Recomendada:
khub/
├── app/                 # Next.js v1 (mover de v1/app)
├── components/          # Mover v1/components
├── lib/                 # Mover v1/lib
├── prisma/              # Mover v1/prisma (usar este)
├── scripts/
│   ├── automation/      # Shell scripts (quick-check, etc)
│   ├── data/            # TS scripts (atualize-ai, etc)
│   └── deploy/          # Deploy scripts
├── docs/                # Toda documentação
├── .github/workflows/   # CI/CD
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── docker-compose.staging.yml
├── public/
├── styles/
├── package.json
├── next.config.mjs
├── tsconfig.json
├── .env.example
└── v1/                  # DEPRECATED (deletar após migração)
```

**Migração:**
```bash
# Script de migração
./scripts/migrate-to-unified-structure.sh
```

---

### 3. **Docker: Otimizar Dockerfile** 🔴

**Problema Atual:**
- v1/Dockerfile usa Debian Bullseye (336MB+)
- Duplicação de Dockerfile (root vs v1)
- Sem healthcheck em production

**Solução - Dockerfile Otimizado:**

```dockerfile
# docker/Dockerfile.optimized
FROM node:20-alpine AS deps
# Alpine é 70% menor que Bullseye

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# ============================================

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ============================================

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
```

**Benefícios:**
- ✅ Redução de ~60% no tamanho (336MB → 130MB)
- ✅ Healthcheck integrado
- ✅ Multi-stage otimizado
- ✅ Segurança melhorada (Alpine)

---

### 4. **Docker Compose: Adicionar Healthcheck** 🔴

**docker-compose.prod.yml Melhorado:**

```yaml
version: '3.8'

services:
  hallyuhub:
    image: ghcr.io/uchidate/khub:latest
    container_name: hallyuhub
    restart: unless-stopped

    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/prod.db
      - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

    volumes:
      - hallyuhub-data:/app/data
      - ./prisma:/app/prisma:ro

    networks:
      - web

    ports:
      - "3000:3000"

    # NOVO: Healthcheck
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # NOVO: Limits de recursos
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

    # NOVO: Logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  hallyuhub-data:
    driver: local

networks:
  web:
    external: true
```

---

## 🟡 ALTO IMPACTO - Implemente Logo

### 5. **Banco de Dados: Migrar para PostgreSQL** 🟡

**Problema Atual - SQLite:**
```prisma
// Campos que deveriam ser arrays ou JSON
stageNames String?  // "IU,Lee Ji-eun" ❌
roles String?       // "vocalist,actor" ❌
socialLinks String? // "instagram:iu,twitter:iu" ❌
streamingPlatforms String? // "netflix,prime" ❌
```

**Limitações:**
- ❌ Sem queries em arrays (`WHERE 'IU' IN stageNames`)
- ❌ Sem índices em JSON
- ❌ Difícil fazer joins complexos
- ❌ Não escala para múltiplos containers
- ❌ Sem full-text search nativo

**Solução - PostgreSQL Schema:**

```prisma
// prisma/schema-postgres.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Artist {
  id              String   @id @default(cuid())
  nameRomanized   String   @unique
  nameHangul      String?
  stageNames      String[] // Array nativo ✅
  roles           Role[]   // Enum array ✅
  bio             String?
  birthDate       DateTime?
  primaryImageUrl String?
  socialLinks     Json?    // JSON nativo ✅
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime? // Soft delete ✅

  agency          Agency?  @relation(fields: [agencyId], references: [id])
  agencyId        String?
  productions     ArtistProduction[]

  @@index([nameRomanized])
  @@index([birthDate])
  @@index([deletedAt])
  @@map("artists")
}

model Production {
  id                  String   @id @default(cuid())
  titlePt             String   @unique
  titleKr             String?
  type                ProductionType
  year                Int
  synopsis            String?
  imageUrl            String?
  streamingPlatforms  Json?    // { "netflix": "url", "prime": "url" } ✅
  sourceUrls          String[] // Array nativo ✅
  tags                Tag[]    // Many-to-many via join table ✅
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  artists             ArtistProduction[]

  @@index([titlePt])
  @@index([type])
  @@index([year])
  @@fulltext([titlePt, synopsis]) // Full-text search ✅
  @@map("productions")
}

enum Role {
  VOCALIST
  RAPPER
  DANCER
  VISUAL
  LEADER
  MAKNAE
  ACTOR
  ACTRESS
  MODEL
  HOST
}

enum ProductionType {
  DRAMA
  MOVIE
  VARIETY
  MUSIC_VIDEO
  DOCUMENTARY
  REALITY_SHOW
}
```

**Migração de Dados:**

```typescript
// scripts/migrate-sqlite-to-postgres.ts
import { PrismaClient as SQLiteClient } from '../prisma/generated/sqlite'
import { PrismaClient as PostgresClient } from '../prisma/generated/postgres'

async function migrate() {
  const sqlite = new SQLiteClient()
  const postgres = new PostgresClient()

  // Migrar Artists
  const artists = await sqlite.artist.findMany()
  for (const artist of artists) {
    await postgres.artist.create({
      data: {
        ...artist,
        stageNames: artist.stageNames?.split(',') || [],
        roles: artist.roles?.split(',') || [],
        socialLinks: artist.socialLinks
          ? JSON.parse(artist.socialLinks)
          : null
      }
    })
  }

  console.log(`✅ Migrated ${artists.length} artists`)
}
```

**Docker Compose com PostgreSQL:**

```yaml
# docker-compose.postgres.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: hallyuhub-db
    restart: unless-stopped

    environment:
      POSTGRES_DB: hallyuhub
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro

    networks:
      - backend

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  hallyuhub:
    depends_on:
      postgres:
        condition: service_healthy

    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/hallyuhub

volumes:
  postgres-data:

networks:
  backend:
  web:
    external: true
```

---

### 6. **Organização: Scripts Consolidados** 🟡

**Estrutura Atual (Confusa):**
```
/scripts/              # Shell (1405 linhas)
v1/scripts/            # TypeScript
v1/.github/workflows/  # CI/CD
```

**Estrutura Proposta:**
```
/scripts/
├── README.md
├── automation/         # Shell scripts
│   ├── quick-check.sh
│   ├── health-check.sh
│   ├── pre-deploy-validation.sh
│   ├── bump-version.sh
│   ├── monitor.sh
│   ├── rollback.sh
│   └── menu.sh
│
├── data/              # Data management (TS)
│   ├── atualize-ai.ts
│   ├── ai-stats.ts
│   ├── refresh-productions.ts
│   ├── refresh-images.ts
│   └── seed.ts
│
├── infra/             # Infrastructure (TS + Shell)
│   ├── backup-db.sh
│   ├── restore-db.sh
│   ├── install-ollama.sh
│   └── setup-server.sh
│
├── integrations/      # External APIs (TS)
│   ├── google-drive-auth.ts
│   ├── google-drive-upload.ts
│   ├── tmdb-sync.ts
│   └── image-search.ts
│
└── migrations/        # Database migrations (TS)
    ├── sqlite-to-postgres.ts
    ├── add-indexes.ts
    └── soft-deletes.ts
```

---

### 7. **CI/CD: Validação Automática** 🟡

**Adicionar ao GitHub Actions:**

```yaml
# .github/workflows/ci.yml
name: CI - Continuous Integration

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build

      - name: Generate Prisma Client
        run: npx prisma generate

      # FUTURO: Adicionar testes
      # - name: Run tests
      #   run: npm test

  docker-build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t hallyuhub:test -f docker/Dockerfile .

      - name: Test Docker image
        run: |
          docker run -d --name test -p 3000:3000 hallyuhub:test
          sleep 10
          curl --fail http://localhost:3000/api/health || exit 1
          docker logs test
          docker stop test
```

---

## 🟢 MÉDIO IMPACTO - Melhorias Incrementais

### 8. **Documentação: Consolidar** 🟢

**Estrutura Atual:**
```
/COMECE-AQUI.md
/INICIO-RAPIDO.md
/VERIFICACAO-VERSOES.md
/RESUMO-EXECUTIVO.md
/CHECKLIST-DEPLOY.md
/INDICE-COMPLETO.md
/PROPOSTAS-GITHUB-ACTIONS.md
v1/docs/
docs/
README.md
v1/README.md
```

**Estrutura Proposta:**
```
/docs/
├── README.md                    # Índice principal
├── getting-started/
│   ├── quick-start.md          # COMECE-AQUI.md
│   ├── installation.md
│   └── first-steps.md
│
├── guides/
│   ├── deployment.md           # CHECKLIST-DEPLOY.md
│   ├── version-management.md   # VERIFICACAO-VERSOES.md
│   ├── monitoring.md
│   └── rollback.md
│
├── operations/
│   ├── docker.md
│   ├── database.md
│   ├── ci-cd.md
│   └── github-actions.md       # PROPOSTAS-GITHUB-ACTIONS.md
│
├── architecture/
│   ├── overview.md             # RESUMO-EXECUTIVO.md
│   ├── database-schema.md
│   ├── api-design.md
│   └── folder-structure.md
│
├── development/
│   ├── local-setup.md
│   ├── coding-standards.md
│   ├── testing.md
│   └── contributing.md
│
└── reference/
    ├── scripts.md
    ├── makefile.md
    ├── environment-vars.md
    └── api.md

/README.md → Link para /docs/README.md
```

---

### 9. **Prisma: Adicionar Índices** 🟢

```prisma
// Melhorar performance de queries

model Artist {
  // ... campos

  @@index([nameRomanized])
  @@index([agencyId])
  @@index([birthDate])
  @@index([createdAt])
  @@index([deletedAt]) // Para soft deletes
  @@index([nameRomanized, deletedAt]) // Composite
}

model Production {
  // ... campos

  @@index([titlePt])
  @@index([type])
  @@index([year])
  @@index([type, year]) // Composite para queries comuns
  @@index([createdAt])
  @@fulltext([titlePt, synopsis]) // PostgreSQL only
}

model News {
  // ... campos

  @@index([publishedAt])
  @@index([title])
  @@fulltext([title, contentMd])
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_performance_indexes
```

---

### 10. **Monitoring: Métricas Básicas** 🟢

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    volumes:
      - grafana-data:/var/lib/grafana
      - ./docker/grafana-dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"
    networks:
      - monitoring
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
```

---

## 📋 Plano de Implementação Sugerido

### 🔴 Semana 1 - CRÍTICO
- [ ] **Dia 1:** Regenerar API keys e remover do Git
- [ ] **Dia 2:** Consolidar estrutura (mover v1 para root)
- [ ] **Dia 3-4:** Otimizar Dockerfile (Alpine)
- [ ] **Dia 5:** Adicionar healthcheck e CI básico

### 🟡 Semana 2 - ALTO IMPACTO
- [ ] **Dia 1-2:** Planejar migração PostgreSQL
- [ ] **Dia 3-4:** Criar schema PostgreSQL e scripts de migração
- [ ] **Dia 5:** Testar migração em staging

### 🟡 Semana 3 - ALTO IMPACTO
- [ ] **Dia 1-2:** Reorganizar scripts
- [ ] **Dia 3:** Implementar CI completo
- [ ] **Dia 4-5:** Testar tudo em staging

### 🟢 Semana 4+ - MELHORIAS CONTÍNUAS
- [ ] Consolidar documentação
- [ ] Adicionar índices no banco
- [ ] Implementar monitoring
- [ ] Adicionar testes

---

## 🎯 Quick Wins (Faça Hoje!)

```bash
# 1. Adicionar healthcheck (5 min)
# Editar docker-compose.prod.yml e adicionar bloco healthcheck

# 2. Melhorar .gitignore (2 min)
echo "v1/.env" >> .gitignore
echo "*.db" >> .gitignore
echo "*.db-journal" >> .gitignore

# 3. Adicionar .dockerignore (3 min)
cat > .dockerignore << EOF
node_modules
.next
.git
.github
docs
*.md
!README.md
.env*
!.env.example
*.log
coverage
.vscode
.idea
EOF

# 4. Adicionar backup script básico (10 min)
cat > scripts/infra/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/hallyuhub"
mkdir -p $BACKUP_DIR

# Backup SQLite
docker exec hallyuhub sqlite3 /app/data/prod.db ".backup '/app/data/backup-$DATE.db'"
docker cp hallyuhub:/app/data/backup-$DATE.db $BACKUP_DIR/

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "backup-*.db" -mtime +7 -delete

echo "✅ Backup completed: backup-$DATE.db"
EOF
chmod +x scripts/infra/backup-db.sh
```

---

## 📊 Métricas de Sucesso

### Antes das Melhorias
- Docker image: 336MB
- Build time: ~3 min
- Deploy confidence: Médio
- Downtime em deploy: Possível
- Estrutura: Confusa
- Segurança: Vulnerável (secrets expostos)

### Depois das Melhorias
- Docker image: ~130MB (-60%)
- Build time: ~2 min (-33%)
- Deploy confidence: Alto (com healthcheck + smoke tests)
- Downtime em deploy: Zero (com healthcheck)
- Estrutura: Clara e organizada
- Segurança: Robusta (secrets protegidos)

---

## 💡 Recursos Adicionais

### Leitura Recomendada
- [Docker Multi-Stage Best Practices](https://docs.docker.com/build/building/multi-stage/)
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [PostgreSQL Indexing Strategies](https://www.postgresql.org/docs/current/indexes.html)

### Ferramentas Úteis
- **Docker:** `dive` (análise de layers), `hadolint` (Dockerfile linter)
- **Secrets:** `trufflehog`, `gitleaks`, `git-secrets`
- **Database:** `pgadmin`, `dbeaver`, `prisma studio`
- **Monitoring:** `prometheus`, `grafana`, `uptime-kuma`

---

*Documento criado em: 02/02/2026*
*Baseado em análise completa do projeto HallyuHub*
