# Geração Automática de Conteúdo

Sistema de geração automática de artistas, notícias e produções usando cron jobs.

## Visão Geral

O sistema executa o script `atualize-ai.ts` automaticamente a cada **15 minutos** nos ambientes de **staging** e **production**, gerando novo conteúdo usando os provedores de AI configurados.

**IMPORTANTE:** Este sistema **NÃO deve ser usado** em ambiente de desenvolvimento local.

## Como Funciona

1. **Cron Job** executa a cada 15 minutos
2. **Script wrapper** (`auto-generate-content.sh`) carrega variáveis de ambiente
3. **Gera conteúdo** limitado (1 notícia + 1 artista por execução)
4. **Envia notificação** para Slack (se configurado)
5. **Registra logs** em `logs/auto-generate-YYYY-MM.log`

### Por que 1 item por execução?

- Evita sobrecarga de API
- Distribui o custo ao longo do tempo
- Reduz chance de rate limiting
- 96 itens/dia (1 a cada 15min × 4 × 24h)

## Instalação em Servidor

### 1. Fazer Deploy do Código

Certifique-se de que o código mais recente está no servidor:

```bash
cd /var/www/hallyuhub
git pull origin main
```

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env.production` ou `.env.staging`:

```bash
# Pelo menos UM provider de AI deve estar configurado
GEMINI_API_KEY=sua_chave_aqui
# OU
OPENAI_API_KEY=sua_chave_aqui
# OU
ANTHROPIC_API_KEY=sua_chave_aqui
# OU
OLLAMA_BASE_URL=http://localhost:11434

# Slack (opcional mas recomendado)
SLACK_WEBHOOK_CONTENT=https://hooks.slack.com/...
SLACK_WEBHOOK_ALERTS=https://hooks.slack.com/...
```

### 3. Executar Script de Setup

```bash
cd /var/www/hallyuhub
bash scripts/setup-auto-generation.sh
```

O script irá:
- ✅ Verificar o ambiente
- ✅ Tornar o script executável
- ✅ Criar diretório de logs
- ✅ Configurar crontab
- ✅ Oferecer teste de execução

### 4. Verificar Configuração

```bash
# Ver crontab configurado
crontab -l

# Testar execução manual
bash scripts/auto-generate-content.sh

# Ver logs em tempo real
tail -f logs/auto-generate-*.log
```

## Gerenciamento

### Ver Logs

```bash
# Logs do mês atual
cat logs/auto-generate-$(date +%Y-%m).log

# Últimas 50 linhas
tail -50 logs/auto-generate-$(date +%Y-%m).log

# Acompanhar em tempo real
tail -f logs/auto-generate-$(date +%Y-%m).log

# Buscar erros
grep "ERRO\|❌" logs/auto-generate-*.log
```

### Pausar Geração Automática

```bash
# Remover entrada do crontab (temporário)
crontab -e
# Comente a linha com # no início

# OU remover completamente
crontab -r
```

### Retomar Geração Automática

```bash
# Re-executar o setup
bash scripts/setup-auto-generation.sh
```

### Ajustar Frequência

Edite o crontab:

```bash
crontab -e
```

Altere a linha:

```bash
# A cada 15 minutos (padrão)
*/15 * * * * /var/www/hallyuhub/scripts/auto-generate-content.sh

# A cada 30 minutos
*/30 * * * * /var/www/hallyuhub/scripts/auto-generate-content.sh

# A cada hora
0 * * * * /var/www/hallyuhub/scripts/auto-generate-content.sh

# A cada 6 horas
0 */6 * * * /var/www/hallyuhub/scripts/auto-generate-content.sh
```

### Ajustar Quantidade de Itens

Edite `scripts/auto-generate-content.sh`:

```bash
# Linha atual (1 notícia + 1 artista)
npm run atualize:ai -- --news 1 --artists 1

# Aumentar para 2 de cada
npm run atualize:ai -- --news 2 --artists 2

# Adicionar produções
npm run atualize:ai -- --news 1 --artists 1 --productions 1
```

## Monitoramento

### Notificações Slack

Se configurado, você receberá notificações no Slack:

- **#hallyuhub-content**: Resumo de itens gerados
- **#hallyuhub-alerts**: Erros ou falhas

### Health Check Manual

```bash
# Verificar última execução
ls -lht logs/auto-generate-*.log | head -1

# Verificar se está gerando conteúdo
docker exec hallyuhub-postgres-dev psql -U hallyuhub -d hallyuhub_dev -c \
  "SELECT MAX(created_at) as last_created FROM \"Artist\" UNION SELECT MAX(created_at) FROM \"News\";"
```

## Troubleshooting

### Cron não está executando

1. **Verificar se o cron está ativo:**
   ```bash
   # macOS
   sudo launchctl list | grep cron

   # Linux
   systemctl status cron
   ```

2. **Verificar permissões do script:**
   ```bash
   ls -l scripts/auto-generate-content.sh
   # Deve ter 'x' (executável)
   ```

3. **Testar execução manual:**
   ```bash
   bash scripts/auto-generate-content.sh
   # Ver se há erros
   ```

### Nenhum conteúdo sendo gerado

1. **Verificar providers de AI:**
   ```bash
   # Ver se há chaves configuradas
   grep -E "GEMINI|OPENAI|ANTHROPIC|OLLAMA" .env.production
   ```

2. **Verificar logs:**
   ```bash
   tail -100 logs/auto-generate-*.log
   # Procurar por erros de API ou rate limiting
   ```

3. **Testar manualmente:**
   ```bash
   npm run atualize:ai -- --news 1 --artists 1
   ```

### Muitos erros de API

Se você está vendo muitos erros de rate limiting ou quota exceeded:

1. **Reduzir frequência:** Mudar de 15min para 30min ou 1h
2. **Usar Ollama:** Grátis e local, sem limites de API
3. **Distribuir entre providers:** Configurar múltiplos providers para fallback

## Custos Estimados

### Com Gemini (Free Tier)
- Limite: 60 requisições/minuto
- Custo: **GRATUITO**
- Geração a cada 15min está muito abaixo do limite

### Com OpenAI
- Custo aproximado: ~$0.002 por geração
- 96 gerações/dia × $0.002 = **~$0.20/dia** ou **~$6/mês**

### Com Ollama (Local)
- Custo: **GRATUITO**
- Requer: ~2-8GB RAM
- Sem limites de requisições

## Migração de Desenvolvimento para Produção

O sistema **NÃO executa automaticamente em development**. Para ter geração automática:

1. **Deploy para staging ou production**
2. **SSH no servidor**
3. **Executar setup:** `bash scripts/setup-auto-generation.sh`

Em desenvolvimento, use geração manual:

```bash
# Desenvolvimento local
npm run atualize:ai -- --news 5 --artists 5
```

## Arquivos do Sistema

- `scripts/auto-generate-content.sh` - Script wrapper executado pelo cron
- `scripts/setup-auto-generation.sh` - Script de instalação do cron
- `scripts/atualize-ai.ts` - Script principal de geração
- `logs/auto-generate-*.log` - Logs de execução (1 arquivo por mês)

## Referências

- [AI Orchestration](./AI_ORCHESTRATION.md) - Sistema de IA e providers
- [Slack Notifications](./SLACK_NOTIFICATIONS.md) - Configuração de notificações
- [Crontab Guru](https://crontab.guru) - Testar expressões cron
