# Instruções de Migração para PostgreSQL

Este documento descreve o processo de migração do SQLite para PostgreSQL em staging e produção.

## ⚠️ IMPORTANTE

A migração de dados deve ser feita **UMA ÚNICA VEZ** após o primeiro deploy com PostgreSQL. O processo é irreversível, então faça backup antes de começar.

## Pré-requisitos

- Docker e Docker Compose instalados no servidor
- Acesso SSH ao servidor
- Backups atualizados do banco SQLite

## Processo de Migração

### 1. Staging

#### 1.1. Fazer backup do banco atual

```bash
ssh user@server
cd /var/www/hallyuhub
bash scripts/backup-db.sh
```

#### 1.2. Copiar banco SQLite para local acessível

```bash
# Copiar o banco SQLite do container para o servidor
docker cp hallyuhub-staging:/app/data/staging.db ./staging-backup.db
```

#### 1.3. Atualizar .env.staging

Certifique-se de que `.env.staging` contém:

```env
# PostgreSQL Configuration
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE
DATABASE_URL="postgresql://hallyuhub:YOUR_SECURE_PASSWORD_HERE@postgres-staging:5432/hallyuhub_staging"

# App Configuration
NEXT_PUBLIC_SITE_URL="http://31.97.255.107:3001"
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production

# Adicione outras chaves aqui (API keys, etc.)
```

**IMPORTANTE**: Substitua `YOUR_SECURE_PASSWORD_HERE` por uma senha forte gerada (ex: `openssl rand -base64 32`).

#### 1.4. Deploy com PostgreSQL

```bash
# O deploy já vai criar o container PostgreSQL e as tabelas
cd /var/www/hallyuhub
bash robust-deploy.sh --pull ghcr.io/uchidate/khub:staging --staging
```

Isso vai:
- Criar o volume `postgres-staging-data`
- Subir o container PostgreSQL
- Executar as migrations (criar tabelas)
- Subir a aplicação

#### 1.5. Verificar se PostgreSQL está rodando

```bash
docker ps | grep postgres
docker logs hallyuhub-postgres-staging
```

#### 1.6. Migrar dados do SQLite para PostgreSQL

```bash
# Copiar o banco SQLite backup para dentro do container da aplicação
docker cp ./staging-backup.db hallyuhub-staging:/tmp/staging.db

# Executar o script de migração dentro do container
docker exec -it hallyuhub-staging sh -c "
  DATABASE_URL=file:/tmp/staging.db \
  DATABASE_URL_POSTGRES=postgresql://hallyuhub:YOUR_SECURE_PASSWORD_HERE@postgres-staging:5432/hallyuhub_staging \
  npm run migrate:postgres
"
```

**IMPORTANTE**: Substitua `YOUR_SECURE_PASSWORD_HERE` pela mesma senha usada no .env.staging.

#### 1.7. Verificar migração

```bash
# Acessar o PostgreSQL e verificar os dados
docker exec -it hallyuhub-postgres-staging psql -U hallyuhub -d hallyuhub_staging

# Dentro do psql:
\dt                          # Listar tabelas
SELECT COUNT(*) FROM "Artist";
SELECT COUNT(*) FROM "Production";
SELECT COUNT(*) FROM "News";
\q                           # Sair
```

#### 1.8. Testar a aplicação

```bash
# Verificar logs
docker logs hallyuhub-staging --tail 100 -f

# Acessar: http://31.97.255.107:3001
# Testar funcionalidades principais
```

#### 1.9. Limpar arquivos temporários

```bash
rm ./staging-backup.db
docker exec hallyuhub-staging rm /tmp/staging.db
```

---

### 2. Produção

#### 2.1. Fazer backup completo

```bash
ssh user@server
cd /var/www/hallyuhub
bash scripts/backup-db.sh
```

#### 2.2. Copiar banco SQLite

```bash
docker cp hallyuhub:/app/data/prod.db ./prod-backup.db
```

#### 2.3. Atualizar .env.production

```env
# PostgreSQL Configuration
POSTGRES_PASSWORD=DIFFERENT_SECURE_PASSWORD_FOR_PROD
DATABASE_URL="postgresql://hallyuhub:DIFFERENT_SECURE_PASSWORD_FOR_PROD@postgres-production:5432/hallyuhub_production"

# App Configuration
NEXT_PUBLIC_SITE_URL="http://31.97.255.107:3000"
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production

# Adicione outras chaves aqui
```

**IMPORTANTE**: Use uma senha DIFERENTE da de staging!

#### 2.4. Deploy com PostgreSQL

```bash
cd /var/www/hallyuhub
bash robust-deploy.sh --pull ghcr.io/uchidate/khub:latest --prod
```

#### 2.5. Verificar PostgreSQL

```bash
docker ps | grep postgres
docker logs hallyuhub-postgres-production
```

#### 2.6. Migrar dados

```bash
# Copiar backup para container
docker cp ./prod-backup.db hallyuhub:/tmp/prod.db

# Executar migração
docker exec -it hallyuhub sh -c "
  DATABASE_URL=file:/tmp/prod.db \
  DATABASE_URL_POSTGRES=postgresql://hallyuhub:DIFFERENT_SECURE_PASSWORD_FOR_PROD@postgres-production:5432/hallyuhub_production \
  npm run migrate:postgres
"
```

#### 2.7. Verificar migração

```bash
docker exec -it hallyuhub-postgres-production psql -U hallyuhub -d hallyuhub_production

# Dentro do psql:
\dt
SELECT COUNT(*) FROM "Artist";
SELECT COUNT(*) FROM "Production";
SELECT COUNT(*) FROM "News";
\q
```

#### 2.8. Testar produção

```bash
docker logs hallyuhub --tail 100 -f
# Acessar: http://31.97.255.107:3000
```

#### 2.9. Limpar

```bash
rm ./prod-backup.db
docker exec hallyuhub rm /tmp/prod.db
```

---

## Troubleshooting

### Erro: "password authentication failed"

- Verifique se a senha no `.env.{staging|production}` está correta
- Verifique se a senha na string de conexão do DATABASE_URL é a mesma que POSTGRES_PASSWORD

### Erro: "could not connect to server"

- Verifique se o container PostgreSQL está rodando: `docker ps | grep postgres`
- Verifique os logs: `docker logs hallyuhub-postgres-{staging|production}`
- Aguarde o healthcheck: `docker inspect hallyuhub-postgres-staging | grep Health -A 10`

### Erro: "table already exists"

- Já existe dados no PostgreSQL. Se quiser recomeçar:
  ```bash
  # CUIDADO: Isso apaga TODOS os dados!
  docker exec -it hallyuhub-postgres-staging psql -U hallyuhub -d hallyuhub_staging -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

  # Depois executar as migrations novamente
  docker compose -f docker-compose.staging.yml run --rm hallyuhub-staging npx prisma migrate deploy
  ```

### Dados não migrados ou faltando

- Verifique os logs da migração
- Compare contagens: `SELECT COUNT(*) FROM "TableName"` no SQLite e PostgreSQL
- Se necessário, repita a migração após limpar o PostgreSQL (veja acima)

---

## Rollback (se necessário)

Se algo der errado e você precisar voltar para SQLite:

1. Parar os containers:
   ```bash
   docker compose -f docker-compose.{staging|prod}.yml down
   ```

2. Restaurar .env.{staging|production} com DATABASE_URL do SQLite:
   ```env
   DATABASE_URL="file:/app/data/staging.db"
   ```

3. Restaurar backup do banco SQLite:
   ```bash
   docker cp ./staging-backup.db hallyuhub-staging:/app/data/staging.db
   ```

4. Fazer deploy novamente com a imagem anterior:
   ```bash
   bash robust-deploy.sh --pull ghcr.io/uchidate/khub:staging --staging
   ```

---

## Checklist Final

- [ ] Backup criado e verificado
- [ ] PostgreSQL container rodando e saudável
- [ ] Migrations aplicadas (tabelas criadas)
- [ ] Dados migrados com sucesso (contagens conferidas)
- [ ] Aplicação funcionando normalmente
- [ ] Testes de CRUD realizados (criar, editar, deletar)
- [ ] Arquivos temporários removidos
- [ ] Documentação atualizada

---

## Benefícios após a migração

- ✅ Arrays nativos (não mais strings separadas por vírgula)
- ✅ JSON nativo (não mais strings JSON)
- ✅ Melhor performance para queries complexas
- ✅ Suporte a transações mais robustas
- ✅ Escalabilidade para futuros crescimentos
- ✅ Backup e restore mais eficientes
