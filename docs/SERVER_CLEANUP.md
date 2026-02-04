# 🧹 Guia de Limpeza do Servidor

## Problema: Espaço em Disco Crescendo Rapidamente

### 🔍 Causas Comuns

1. **Docker Images Antigas** (MAIS COMUM ⚠️)
   - Cada deploy cria uma nova imagem Docker
   - Imagens antigas não são removidas automaticamente
   - Cada imagem pode ter 500MB-1GB
   - Com 10-20 deploys/dia, isso acumula rápido!

2. **Docker Volumes e Cache**
   - Build cache do Docker
   - Volumes órfãos (containers removidos mas volumes permanecem)
   - npm cache dentro dos containers

3. **Logs Crescendo**
   - Logs de aplicação sem rotation
   - Logs do Docker sem limite
   - Logs do sistema

4. **Backups do Banco de Dados**
   - Backups diários acumulando
   - Sem política de retention

5. **Node Modules e Builds**
   - node_modules locais (se existirem no servidor)
   - Builds do Next.js (.next) antigos

---

## 🚀 Como Diagnosticar

### Via SSH (Remoto):

```bash
# 1. Conectar ao servidor
ssh user@seu-servidor

# 2. Executar diagnóstico
cd /var/www/hallyuhub
./scripts/cleanup-server.sh diagnose
```

### Comandos Manuais:

```bash
# Verificar espaço em disco
df -h

# Ver tamanho do projeto
du -sh /var/www/hallyuhub

# Ver imagens Docker (PRINCIPAL CULPADO!)
docker images

# Ver containers
docker ps -a

# Ver volumes
docker volume ls

# Ver espaço usado pelo Docker
docker system df
```

---

## 🧹 Como Limpar

### Opção 1: Limpeza Segura (Recomendado)

```bash
cd /var/www/hallyuhub
./scripts/cleanup-server.sh clean
```

**O que faz:**
- ✅ Remove imagens Docker antigas (mantém últimas 3)
- ✅ Remove containers parados
- ✅ Remove imagens dangling
- ✅ Remove volumes não utilizados
- ✅ Trunca logs grandes (mantém últimas 1000 linhas)
- ✅ NÃO afeta containers rodando

**Seguro para produção:** SIM ✅

### Opção 2: Limpeza Profunda (Cuidado!)

```bash
cd /var/www/hallyuhub
./scripts/cleanup-server.sh deep-clean
```

**O que faz:**
- ⚠️ Para TODOS os containers
- ⚠️ Remove TODOS os containers
- ⚠️ Remove TODAS as imagens
- ⚠️ Remove TODOS os volumes
- ⚠️ Limpa TODOS os logs
- ⚠️ Remove backups antigos (mantém últimos 5)

**Seguro para produção:** NÃO ⚠️ (requer redeploy)

---

## 🔧 Limpeza Manual por Componente

### Docker Images (PRINCIPAL PROBLEMA!)

```bash
# Ver imagens e tamanhos
docker images

# Remover imagens antigas (mantendo últimas 3)
docker images ghcr.io/uchidate/khub --format "{{.ID}} {{.CreatedAt}}" | \
  tail -n +4 | awk '{print $1}' | xargs docker rmi -f

# Remover imagens dangling
docker image prune -f

# Limpeza agressiva (CUIDADO!)
docker image prune -af
```

### Docker System

```bash
# Ver uso total do Docker
docker system df

# Limpar tudo (CUIDADO - remove cache de build!)
docker system prune -af --volumes
```

### Containers

```bash
# Remover containers parados
docker container prune -f

# Remover container específico
docker rm container_name
```

### Volumes

```bash
# Ver volumes
docker volume ls

# Remover volumes não utilizados
docker volume prune -f
```

### Logs

```bash
# Ver logs grandes
find /var/www/hallyuhub -name "*.log" -size +10M -exec du -sh {} \;

# Truncar log específico
truncate -s 0 /caminho/para/log.log

# Truncar mantendo últimas 1000 linhas
tail -1000 arquivo.log > arquivo.log.tmp && mv arquivo.log.tmp arquivo.log
```

### Backups

```bash
# Ver backups
ls -lh /var/www/hallyuhub/backups/*.sql.gz

# Remover backups antigos (mantendo últimos 5)
cd /var/www/hallyuhub/backups
ls -t *.sql.gz | tail -n +6 | xargs rm -f
```

---

## 🛡️ Prevenção

### 1. Automação de Limpeza

Adicionar ao cron para rodar semanalmente:

```bash
# Editar crontab
crontab -e

# Adicionar linha (roda toda segunda às 3am)
0 3 * * 1 cd /var/www/hallyuhub && ./scripts/cleanup-server.sh clean >> /var/log/hallyuhub-cleanup.log 2>&1
```

### 2. Log Rotation

Criar `/etc/logrotate.d/hallyuhub`:

```
/var/www/hallyuhub/**/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
}
```

### 3. Docker Prune Periódico

Adicionar ao workflow de deploy (`.github/workflows/deploy.yml`):

```yaml
- name: 🧹 Cleanup Old Docker Images
  run: |
    # Remove images older than 7 days
    docker image prune -af --filter "until=168h"
```

### 4. Política de Backups

Manter apenas:
- Últimos 7 backups diários
- Últimos 4 backups semanais
- Último backup mensal

### 5. Monitoramento

Adicionar alerta quando disco atingir 80%:

```bash
# Adicionar ao cron (verifica a cada hora)
0 * * * * df -h | awk '$NF=="/" && $5+0 > 80 {print "ALERTA: Disco em " $5}'
```

---

## 📊 Espaço Esperado

### Produção Normal:
- **Imagens Docker:** 500MB-1.5GB (1-3 imagens)
- **Volumes:** 100-300MB
- **Código:** 10-20MB
- **Logs:** <100MB (com rotation)
- **Backups:** 500MB-1GB (últimos 7 dias)
- **TOTAL:** ~2-4GB

### Se estiver usando >10GB:
- ⚠️ Provavelmente tem imagens Docker antigas acumulando
- ⚠️ Execute a limpeza imediatamente

---

## 🚨 Cenário de Emergência

Se o disco estiver 100% cheio:

```bash
# 1. Verificar o que está ocupando
df -h
docker system df

# 2. Remover imagens antigas (URGENTE!)
docker image prune -af --filter "until=24h"

# 3. Limpar cache de build
docker builder prune -af

# 4. Remover logs
find /var/www/hallyuhub -name "*.log" -exec truncate -s 0 {} \;

# 5. Se ainda não resolver, deep clean
cd /var/www/hallyuhub
./scripts/cleanup-server.sh deep-clean
# Depois: redeploy!
```

---

## 📝 Checklist de Manutenção Mensal

- [ ] Executar `cleanup-server.sh clean`
- [ ] Verificar espaço em disco (`df -h`)
- [ ] Verificar imagens Docker antigas (`docker images`)
- [ ] Verificar logs grandes (`find . -name "*.log" -size +50M`)
- [ ] Verificar backups (`ls -lh backups/`)
- [ ] Confirmar que log rotation está funcionando
- [ ] Revisar uso do Docker (`docker system df`)

---

## 🔗 Links Úteis

- [Docker System Prune](https://docs.docker.com/engine/reference/commandline/system_prune/)
- [Docker Image Prune](https://docs.docker.com/engine/reference/commandline/image_prune/)
- [Logrotate Tutorial](https://www.digitalocean.com/community/tutorials/how-to-manage-logfiles-with-logrotate-on-ubuntu-20-04)
