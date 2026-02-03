# Melhoria #4 - Migração de SQLite para PostgreSQL

## 📊 Situação Atual

### Limitações do SQLite

**Problemas identificados:**
1. ❌ Arrays como strings JSON (não nativos)
2. ❌ Sem suporte full-text search nativo
3. ❌ Performance limitada em produção
4. ❌ Concorrência limitada (lock no arquivo)
5. ❌ Backup/restore mais complexo

**Estrutura atual:**
```
DATABASE_URL="file:/app/data/prod.db"      # Produção
DATABASE_URL="file:/app/data/staging.db"   # Staging
```

### Benefícios do PostgreSQL

**Vantagens:**
1. ✅ Arrays nativos (`String[]`, `Int[]`)
2. ✅ Full-text search integrado
3. ✅ Melhor performance em escala
4. ✅ Concorrência real (MVCC)
5. ✅ Backup/restore simples (pg_dump)
6. ✅ Suporte JSON nativo
7. ✅ Índices avançados (GIN, GiST)
8. ✅ Transações robustas

---

## 🎯 Objetivo da Melhoria

**Migrar de SQLite para PostgreSQL mantendo:**
- ✅ Todos os dados preservados
- ✅ Estrutura do schema
- ✅ Funcionalidade sem quebras
- ✅ Processo Local → Staging → Produção

---

## 📋 Plano de Migração

### Fase 1: Preparação Local

#### 1.1 - Setup PostgreSQL Local

```bash
# Docker Compose para desenvolvimento local
cat > docker-compose.dev.yml <<EOF
services:
  postgres:
    image: postgres:16-alpine
    container_name: hallyuhub-postgres-dev
    environment:
      POSTGRES_USER: hallyuhub
      POSTGRES_PASSWORD: dev_password_change_me
      POSTGRES_DB: hallyuhub_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-dev-data:
EOF
```

#### 1.2 - Atualizar Prisma Schema

**Mudanças no schema:**
- Provider: `sqlite` → `postgresql`
- Arrays: `String` → `String[]`
- URLs: Ajustar formato

**Exemplo:**
```prisma
// Antes (SQLite)
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Artist {
  genres String  // JSON string: '["K-Pop", "R&B"]'
}

// Depois (PostgreSQL)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Artist {
  genres String[]  // Array nativo
}
```

#### 1.3 - Script de Migração de Dados

Criar script para:
1. Exportar dados do SQLite
2. Transformar JSON arrays → Arrays nativos
3. Importar para PostgreSQL

#### 1.4 - Testar Local

```bash
# Iniciar PostgreSQL local
docker-compose -f docker-compose.dev.yml up -d

# Atualizar .env local
DATABASE_URL="postgresql://hallyuhub:dev_password_change_me@localhost:5432/hallyuhub_dev"

# Rodar migração
npm run prisma:migrate

# Seed com dados
npm run prisma:seed

# Testar aplicação
npm run dev
```

---

### Fase 2: Staging

#### 2.1 - Setup PostgreSQL no Servidor

```bash
# SSH no servidor
ssh root@31.97.255.107

# Criar docker-compose para PostgreSQL
cat > /var/www/hallyuhub/docker-compose.postgres.yml <<EOF
services:
  postgres-staging:
    image: postgres:16-alpine
    container_name: postgres-staging
    environment:
      POSTGRES_USER: hallyuhub
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: hallyuhub_staging
    ports:
      - "5433:5432"  # Porta diferente de produção
    volumes:
      - postgres-staging-data:/var/lib/postgresql/data
    networks:
      - web
    restart: always

volumes:
  postgres-staging-data:

networks:
  web:
    external: true
EOF

# Iniciar PostgreSQL
docker-compose -f docker-compose.postgres.yml up -d
```

#### 2.2 - Atualizar .env.staging

```bash
# No servidor
cat > /var/www/hallyuhub/.env.staging <<EOF
DATABASE_URL="postgresql://hallyuhub:SENHA_FORTE@postgres-staging:5432/hallyuhub_staging"
DEPLOY_ENV=staging
# ... outras variáveis
EOF
```

#### 2.3 - Migrar Dados Staging

```bash
# Backup SQLite atual
docker exec hallyuhub-staging sh -c "cp /app/data/staging.db /app/data/staging.db.backup"

# Rodar script de migração
# (dentro do container ou via script externo)
```

#### 2.4 - Deploy e Validação

```bash
# Push para develop (trigger deploy staging)
git push origin develop

# Validar
curl http://31.97.255.107:3001/api/health
# Testar funcionalidades
```

---

### Fase 3: Produção

#### 3.1 - Setup PostgreSQL Produção

```bash
# Criar docker-compose para produção
cat > /var/www/hallyuhub/docker-compose.postgres-prod.yml <<EOF
services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-prod
    environment:
      POSTGRES_USER: hallyuhub
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: hallyuhub_prod
    ports:
      - "5432:5432"
    volumes:
      - postgres-prod-data:/var/lib/postgresql/data
    networks:
      - web
    restart: always

volumes:
  postgres-prod-data:

networks:
  web:
    external: true
EOF

# Iniciar
docker-compose -f docker-compose.postgres-prod.yml up -d
```

#### 3.2 - Backup Completo SQLite

```bash
# Backup do banco atual
docker exec hallyuhub sh -c "cp /app/data/prod.db /app/data/prod.db.backup.$(date +%Y%m%d)"

# Download local do backup
scp root@31.97.255.107:/var/www/hallyuhub/data/prod.db.backup.* ./backups/
```

#### 3.3 - Migrar Dados Produção

```bash
# Rodar script de migração
# Validar integridade dos dados
```

#### 3.4 - Deploy Final

```bash
# Merge para main
git push origin main

# Monitorar logs
ssh root@31.97.255.107 "docker logs -f hallyuhub"

# Validar
curl http://31.97.255.107:3000/api/health
```

---

## 🔧 Alterações Necessárias

### 1. prisma/schema.prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Artist {
  id          String   @id @default(uuid())
  name        String
  nameKr      String?
  birthDate   DateTime?
  debutYear   Int?
  agency      Agency?  @relation(fields: [agencyId], references: [id])
  agencyId    String?
  bio         String?
  imageUrl    String?
  genres      String[]  // ✅ Array nativo
  socialMedia Json?     // ✅ JSON nativo
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Production {
  id          String   @id @default(uuid())
  title       String
  titleKr     String?
  type        String   // drama, movie, variety
  releaseYear Int?
  synopsis    String?
  imageUrl    String?
  genres      String[]  // ✅ Array nativo
  cast        Json?     // ✅ JSON nativo
  crew        Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ... outros models
```

### 2. scripts/migrate-to-postgres.ts

```typescript
import { PrismaClient as SQLiteClient } from '@prisma/client'
import { PrismaClient as PostgresClient } from '@prisma/client'

async function migrate() {
  const sqlite = new SQLiteClient({
    datasources: { db: { url: 'file:./data/prod.db' } }
  })

  const postgres = new PostgresClient({
    datasources: { db: { url: process.env.DATABASE_URL } }
  })

  try {
    // Migrar Artists
    const artists = await sqlite.artist.findMany()
    for (const artist of artists) {
      await postgres.artist.create({
        data: {
          ...artist,
          genres: JSON.parse(artist.genres || '[]'), // String → Array
          socialMedia: JSON.parse(artist.socialMedia || '{}')
        }
      })
    }

    // Migrar Productions
    const productions = await sqlite.production.findMany()
    for (const prod of productions) {
      await postgres.production.create({
        data: {
          ...prod,
          genres: JSON.parse(prod.genres || '[]'),
          cast: JSON.parse(prod.cast || '[]'),
          crew: JSON.parse(prod.crew || '{}')
        }
      })
    }

    // ... outros models

    console.log('✅ Migração concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  } finally {
    await sqlite.$disconnect()
    await postgres.$disconnect()
  }
}

migrate()
```

### 3. docker-compose.staging.yml

```yaml
services:
  postgres-staging:
    image: postgres:16-alpine
    container_name: postgres-staging
    environment:
      POSTGRES_USER: hallyuhub
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: hallyuhub_staging
    ports:
      - "5433:5432"
    volumes:
      - postgres-staging-data:/var/lib/postgresql/data
    networks:
      - web
    restart: always

  hallyuhub-staging:
    image: ghcr.io/uchidate/khub:staging
    container_name: hallyuhub-staging
    depends_on:
      - postgres-staging
    ports:
      - "3001:3000"
    environment:
      - DEPLOY_ENV=staging
      - DATABASE_URL=postgresql://hallyuhub:${POSTGRES_PASSWORD}@postgres-staging:5432/hallyuhub_staging
    env_file:
      - .env.staging
    volumes:
      - hallyuhub-data:/app/data  # Para backup SQLite
    networks:
      - web
    restart: always

volumes:
  postgres-staging-data:
  hallyuhub-data:
    external: true

networks:
  web:
    external: true
```

### 4. docker-compose.prod.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-prod
    environment:
      POSTGRES_USER: hallyuhub
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: hallyuhub_prod
    ports:
      - "5432:5432"
    volumes:
      - postgres-prod-data:/var/lib/postgresql/data
    networks:
      - web
    restart: always

  hallyuhub:
    image: ghcr.io/uchidate/khub:latest
    container_name: hallyuhub
    depends_on:
      - postgres
    ports:
      - "3000:3000"
    environment:
      - DEPLOY_ENV=production
      - DATABASE_URL=postgresql://hallyuhub:${POSTGRES_PASSWORD}@postgres:5432/hallyuhub_prod
    env_file:
      - .env.production
    volumes:
      - hallyuhub-data:/app/data  # Para backup SQLite
    networks:
      - web
    restart: always

volumes:
  postgres-prod-data:
  hallyuhub-data:
    external: true

networks:
  web:
    external: true
```

---

## ✅ Checklist de Validação

### Local
- [ ] PostgreSQL rodando em Docker
- [ ] Schema atualizado (arrays nativos)
- [ ] Migração criada e aplicada
- [ ] Seed funcionando
- [ ] Aplicação funcionando com PostgreSQL
- [ ] Testes passando

### Staging
- [ ] PostgreSQL rodando no servidor
- [ ] Backup SQLite criado
- [ ] Dados migrados com sucesso
- [ ] Health endpoint respondendo
- [ ] Funcionalidades testadas
- [ ] Sem erros nos logs

### Produção
- [ ] PostgreSQL rodando
- [ ] Backup completo SQLite
- [ ] Dados migrados e validados
- [ ] Health endpoint OK
- [ ] Aplicação funcionando
- [ ] Performance validada

---

## 🔙 Rollback

### Se algo der errado:

**Staging:**
```bash
# Restaurar SQLite
DATABASE_URL="file:/app/data/staging.db.backup"

# Redeploy com SQLite
git revert <commit-postgres>
git push origin develop
```

**Produção:**
```bash
# Restaurar backup SQLite
DATABASE_URL="file:/app/data/prod.db.backup.YYYYMMDD"

# Redeploy
git revert <commit-postgres>
git push origin main
```

---

## ⏱️ Tempo Estimado

- **Preparação local:** 1-2 horas
- **Setup staging:** 30 min
- **Validação staging:** 30 min
- **Setup produção:** 30 min
- **Migração produção:** 1 hora (com validação)

**Total: 3h30 - 4h30**

---

## 🎯 Próximos Passos

1. ✅ Ler e aprovar este plano
2. ⏳ Configurar PostgreSQL local
3. ⏳ Atualizar Prisma schema
4. ⏳ Criar script de migração
5. ⏳ Testar local
6. ⏳ Deploy staging
7. ⏳ Deploy produção

---

**Status:** 📋 Aguardando aprovação

**Criado em:** 2026-02-03
