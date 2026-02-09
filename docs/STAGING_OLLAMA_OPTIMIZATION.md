# Otimização de Ollama no Staging

## 📋 Visão Geral

Para economizar recursos no ambiente de staging, o Ollama foi configurado para **ligar apenas durante as atualizações** e desligar automaticamente após uso.

### Diferenças entre ambientes:

| Ambiente | Ollama | Memória | Restart Policy |
|----------|--------|---------|----------------|
| **Production** | Sempre ligado | 4GB | `always` |
| **Staging** | On-demand | 4GB (quando ativo) | `no` |

**Economia no Staging**: ~4GB de RAM quando Ollama não está em uso (a maior parte do tempo).

---

## 🔧 Como Funciona

### 1. Docker Compose Staging
O Ollama está configurado com `restart: "no"` no `docker-compose.staging.yml`:

```yaml
ollama-staging:
  image: ollama/ollama:latest
  restart: "no"  # Não reinicia automaticamente
  deploy:
    resources:
      limits:
        memory: 4G  # Mesmo que produção quando ativo
```

### 2. Script de Cron Otimizado
O script `scripts/staging-cron.sh` gerencia o ciclo de vida do Ollama:

1. **Inicia** Ollama container
2. **Aguarda** até estar pronto (timeout: 30s)
3. **Executa** atualização via `/api/cron/update`
4. **Para** Ollama container (economiza ~4GB RAM)

---

## 🚀 Configuração no Servidor

### Configurar Crontab (Staging)

```bash
# Editar crontab
crontab -e

# Adicionar (a cada 30 minutos):
*/30 * * * * /var/www/hallyuhub/scripts/staging-cron.sh >> /var/www/hallyuhub/logs/cron.log 2>&1
```

### Verificar Logs

```bash
# Logs do script de cron
tail -f /var/www/hallyuhub/logs/staging-cron-$(date +%Y-%m).log

# Logs do Ollama (quando ativo)
docker-compose -f docker-compose.staging.yml logs -f ollama-staging
```

### Testar Manualmente

```bash
cd /var/www/hallyuhub

# Executar script de cron
./scripts/staging-cron.sh

# Verificar status do Ollama (deve estar parado após execução)
docker-compose -f docker-compose.staging.yml ps ollama-staging
```

---

## 📊 Benefícios

### Economia de Recursos
- **RAM**: ~4GB economizados quando não está em uso
- **CPU**: 0.5 core economizado quando não está em uso
- **Staging roda mais leve**: Usa recursos apenas durante atualizações (30min a cada execução)

### Production Mantém Performance
- Ollama sempre ativo
- Sem cold start nas traduções
- Resposta imediata para atualizações

---

## 🔍 Troubleshooting

### Ollama não inicia
```bash
# Ver logs do container
docker logs hallyuhub-ollama-staging

# Verificar memória disponível
free -h

# Iniciar manualmente
docker-compose -f docker-compose.staging.yml up -d ollama-staging
```

### Timeout aguardando Ollama
- **Causa**: Servidor com pouca memória, Ollama demora para carregar modelo
- **Solução**: Aumentar `OLLAMA_STARTUP_TIMEOUT` no script

### Ollama não para após cron
```bash
# Parar manualmente
docker-compose -f docker-compose.staging.yml stop ollama-staging

# Verificar se realmente parou
docker ps | grep ollama
```

---

## 📝 Notas

- O modelo `phi3:latest` continua armazenado no volume (`ollama-staging-data`)
- Não precisa baixar o modelo toda vez - apenas iniciar o container
- Cold start do Ollama leva ~10-15s
- Script tem timeout de 30s para inicialização

---

## 🔄 Migração de Staging Antigo

Se você tem um staging rodando com Ollama `restart: on-failure`, migrar para o novo sistema:

1. Atualizar `docker-compose.staging.yml`
2. Recriar container Ollama:
   ```bash
   docker-compose -f docker-compose.staging.yml stop ollama-staging
   docker-compose -f docker-compose.staging.yml rm -f ollama-staging
   docker-compose -f docker-compose.staging.yml up -d ollama-staging
   ```
3. Configurar novo cron job com `staging-cron.sh`
4. Testar execução manual

---

**Última atualização**: 2026-02-09
**Autor**: Claude Code
