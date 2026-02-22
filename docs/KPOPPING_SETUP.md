# Kpopping Database Setup

Base de dados separada para dados scrapeados do kpopping.com.

## 1. Criar banco de dados

No servidor PostgreSQL, criar um banco separado:

```sql
CREATE DATABASE kpopping_db;
CREATE USER kpopping WITH PASSWORD 'SUA_SENHA_AQUI';
GRANT ALL PRIVILEGES ON DATABASE kpopping_db TO kpopping;
```

## 2. Configurar variável de ambiente

Adicionar no `.env.local` (dev) e nos secrets do GitHub Actions (prod):

```env
KPOPPING_DATABASE_URL=postgresql://kpopping:SUA_SENHA_AQUI@localhost:5432/kpopping_db
```

No servidor de produção, o banco pode estar no mesmo PostgreSQL:

```env
KPOPPING_DATABASE_URL=postgresql://kpopping:SUA_SENHA_AQUI@postgres-production:5432/kpopping_db
```

## 3. Gerar client e criar tabelas

```bash
# Gerar Prisma client
npx prisma generate --schema=prisma-kpopping/schema.prisma --config=prisma-kpopping/prisma.config.ts

# Criar tabelas no banco
npx prisma migrate deploy --schema=prisma-kpopping/schema.prisma --config=prisma-kpopping/prisma.config.ts
```

## 4. Rodar sync

```bash
# Testar um idol específico (sem DB):
npx tsx scripts/kpopping-sync.ts --slug=Jisoo

# Sync completo (idols):
npx tsx scripts/kpopping-sync.ts

# Sync idols + grupos:
npx tsx scripts/kpopping-sync.ts --groups

# Limitar para testes:
npx tsx scripts/kpopping-sync.ts --limit=10

# No servidor (dentro do Docker):
docker exec hallyuhub sh -c 'cd /app && node_modules/.bin/tsx scripts/kpopping-sync.ts --limit=20'
```

## Schema

- **Idol**: slug, nameRomanized, nameHangul, birthday, height, weight, bloodType, zodiacSign, mbti, debutDate, education, imageUrl, rawData (JSON completo)
- **Group**: slug, name, nameHangul, debutDate, agency, fandomName, fandomColors, imageUrl
- **IdolInGroup**: relação N:N entre Idol e Group

## Dados disponíveis por idol

| Campo | Exemplo |
|---|---|
| nameHangul | 지수 |
| birthday | 1995-01-03 |
| height | 162 cm |
| weight | 44 kg |
| bloodType | A |
| zodiacSign | Capricorn |
| mbti | ISTP |
| debutDate | 2016-08-08 |
| education | School Of Performing Arts Seoul (SOPA) |
| fandom | BLINK |
| imageUrl | https://cdn.kpopping.com/idols/Jisoo/profile.jpg |
