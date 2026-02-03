# Melhoria #9: Backup PostgreSQL Automatizado

## Resumo

Sistema completo de backup e restauracao para PostgreSQL com rotacao automatica e integracao com GitHub Actions.

**Status:** Implementado
**Data:** 03/02/2026
**Impacto:** Alto - Seguranca de dados

---

## Funcionalidades

| Funcionalidade | Descricao |
|----------------|-----------|
| Backup automatico | Diariamente as 00:00 (Brasilia) via GitHub Actions |
| Backup pre-deploy | Automatico antes de cada deploy em producao |
| Rotacao | Mantem ultimos 30 backups por padrao |
| Compressao | Arquivos .sql.gz para economia de espaco |
| Ambientes separados | Backups de prod e staging em diretorios distintos |
| Restauracao segura | Com confirmacao e verificacao de integridade |

---

## Estrutura de Arquivos

```
/var/www/hallyuhub/
├── scripts/
│   ├── backup-db.sh      # Script de backup PostgreSQL
│   └── restore-db.sh     # Script de restauracao
├── backups/
│   ├── production/       # Backups de producao
│   │   ├── backup-20260203-030000.sql.gz
│   │   ├── backup-20260202-030000.sql.gz
│   │   └── ...
│   └── staging/          # Backups de staging
│       └── ...
```

---

## Como Usar

### Backup Manual

```bash
# No servidor
cd /var/www/hallyuhub

# Backup de producao (padrao)
bash scripts/backup-db.sh

# Backup de producao com opcoes
bash scripts/backup-db.sh --prod --keep 30

# Backup de staging
bash scripts/backup-db.sh --staging

# Backup com upload para Google Drive (se configurado)
bash scripts/backup-db.sh --prod --upload
```

### Restauracao

```bash
# Restaurar backup mais recente em producao
bash scripts/restore-db.sh --prod

# Restaurar arquivo especifico
bash scripts/restore-db.sh --prod backup-20260203-030000.sql.gz

# Restaurar em staging
bash scripts/restore-db.sh --staging

# Restaurar sem confirmacao (CUIDADO!)
bash scripts/restore-db.sh --prod --force backup-20260203-030000.sql.gz
```

### Via GitHub Actions

1. Acesse: **Actions** > **Database Backup**
2. Clique em **Run workflow**
3. Selecione:
   - **Environment:** production, staging, ou both
   - **Keep backups:** quantidade de backups a manter

---

## Automacao

### Backup Diario (GitHub Actions)

O workflow `db-backup.yml` executa automaticamente:
- **Horario:** 03:00 UTC (00:00 Brasilia)
- **Ambiente:** Producao
- **Retencao:** 30 backups

### Backup Pre-Deploy

O script `robust-deploy.sh` executa backup automatico antes de cada deploy em producao:

```bash
# Trecho do robust-deploy.sh
if [ "$env_type" = "production" ]; then
  echo "Criando backup do banco antes do deploy..."
  bash scripts/backup-db.sh --prod --keep 30
fi
```

---

## Configuracao de Retencao

| Ambiente | Retencao Padrao | Espaco Estimado |
|----------|-----------------|-----------------|
| Production | 30 dias | ~150MB (5MB/dia) |
| Staging | 7 dias | ~35MB |

Para alterar a retencao, use o parametro `--keep`:

```bash
# Manter apenas 7 dias
bash scripts/backup-db.sh --prod --keep 7

# Manter 60 dias
bash scripts/backup-db.sh --prod --keep 60
```

---

## Verificacao de Backups

### Listar Backups Disponiveis

```bash
# Producao
ls -lht /var/www/hallyuhub/backups/production/

# Staging
ls -lht /var/www/hallyuhub/backups/staging/
```

### Verificar Integridade

```bash
# Testar se o arquivo esta integro
gunzip -t /var/www/hallyuhub/backups/production/backup-20260203-030000.sql.gz

# Ver conteudo (primeiras linhas)
gunzip -c /var/www/hallyuhub/backups/production/backup-20260203-030000.sql.gz | head -50
```

### Estatisticas do Backup

```bash
# Tamanho total de backups
du -sh /var/www/hallyuhub/backups/production/
du -sh /var/www/hallyuhub/backups/staging/
```

---

## Troubleshooting

### Backup falhou

```bash
# Verificar se o container PostgreSQL esta rodando
docker ps | grep postgres

# Verificar logs do container
docker logs hallyuhub-postgres-production

# Testar conexao manualmente
docker exec hallyuhub-postgres-production psql -U hallyuhub -d hallyuhub_production -c "\dt"
```

### Restauracao falhou

```bash
# Verificar se o arquivo existe e esta integro
ls -l /var/www/hallyuhub/backups/production/
gunzip -t /var/www/hallyuhub/backups/production/backup-*.sql.gz

# Ver logs da aplicacao apos restauracao
docker logs hallyuhub --tail=20
```

### Espaco em disco

```bash
# Verificar espaco disponivel
df -h /var/www/hallyuhub/backups/

# Limpar backups antigos manualmente
cd /var/www/hallyuhub/backups/production/
ls -1t backup-*.sql.gz | tail -n +8 | xargs rm -f  # Mantem apenas 7 mais recentes
```

---

## Seguranca

1. **Permissoes:** Scripts acessiveis apenas para root
2. **Senhas:** Nao expostas nos scripts (usa credenciais do container)
3. **Localizacao:** Backups fora do diretorio web publico
4. **Rotacao:** Automatica para evitar acumulo indefinido

### Recomendacoes

- Configure backup offsite (Google Drive, S3, etc.)
- Teste restauracao periodicamente
- Monitore espaco em disco no servidor
- Mantenha pelo menos 1 backup em local separado

---

## Arquivos Modificados/Criados

```
scripts/backup-db.sh          # NOVO - Script de backup PostgreSQL
scripts/restore-db.sh         # ATUALIZADO - Agora suporta PostgreSQL
.github/workflows/db-backup.yml # ATUALIZADO - Workflow melhorado
robust-deploy.sh              # ATUALIZADO - Usa novo script de backup
docs/MELHORIA-9-BACKUP.md     # NOVO - Esta documentacao
```

---

## Proximos Passos (Opcionais)

1. **Backup Offsite:** Configurar upload automatico para Google Drive ou S3
2. **Alertas:** Notificacao por email/Slack em caso de falha
3. **Monitoramento:** Metrica de "ultimo backup bem sucedido" no Prometheus
4. **Teste Automatico:** Job que restaura backup em ambiente isolado para validacao

---

*Implementado em: 03/02/2026*
*Stack: PostgreSQL 16 + pg_dump + gzip*
