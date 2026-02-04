# 🕐 Sistema de Atualização Automática (Cron Jobs)

Este documento descreve como configurar e usar o sistema de atualização automática de conteúdo do HallyuHub.

## 📋 Visão Geral

O sistema executa atualizações periódicas de:
- **Artistas**: Gera 2 novos artistas a cada execução (~8 artistas/hora)
- **Notícias**: Gera 2 novas notícias a cada execução (~8 notícias/hora)
- **Filmografia**: Atualiza 3 artistas por execução (~12 artistas/hora)
- **Trending Scores**: Recalcula scores de tendências para todos os artistas

## 🚀 Configuração

### 1. Variáveis de Ambiente

Adicione ao seu `.env` ou configurações da Vercel:

```bash
# Token de segurança para o cron job
# Gere um token seguro: openssl rand -hex 32
CRON_SECRET="your-secure-random-token-here"

# Chaves de API para geradores de conteúdo (pelo menos uma é necessária)
GEMINI_API_KEY="your-gemini-key"
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
```

### 2. Opções de Implementação

#### Opção A: Vercel Cron (Recomendado para Vercel) ⭐

**Já configurado automaticamente via `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/update",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Frequência**: A cada 15 minutos
**Custo**: Incluído nos planos Hobby/Pro da Vercel
**Limite**: Máximo 2 cron jobs no plano Hobby

Para configurar na Vercel:
1. Faça deploy do projeto
2. O `vercel.json` será detectado automaticamente
3. Verifique em: Vercel Dashboard → Project → Cron Jobs

#### Opção B: GitHub Actions

Crie `.github/workflows/cron-update.yml`:

```yaml
name: Atualização Automática

on:
  schedule:
    - cron: '*/15 * * * *'  # A cada 15 minutos
  workflow_dispatch:        # Permite execução manual

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron endpoint
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/update
```

**Configuração**:
1. Vá em: GitHub → Settings → Secrets → Actions
2. Adicione secret: `CRON_SECRET` com o mesmo valor do .env

#### Opção C: Serviço Externo

Use um serviço como:
- **cron-job.org** (Gratuito, confiável)
- **EasyCron** (Pago, mais features)
- **UptimeRobot** (Gratuito, também monitora)

**Configuração**:
1. Crie uma conta
2. Configure um job HTTP GET/POST para:
   ```
   https://your-domain.com/api/cron/update?token=YOUR_CRON_SECRET
   ```
3. Defina frequência: `*/15 * * * *` (a cada 15 minutos)

## 🔒 Segurança

O endpoint `/api/cron/update` requer autenticação via:

**Header (Recomendado)**:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/update
```

**Query Parameter** (alternativa):
```bash
curl https://your-domain.com/api/cron/update?token=YOUR_CRON_SECRET
```

⚠️ **IMPORTANTE**: Nunca exponha o `CRON_SECRET` em código cliente ou logs públicos.

## 📊 Monitoramento

### Logs em Produção

**Vercel**:
1. Dashboard → Project → Logs
2. Filtre por: `/api/cron/update`
3. Verifique timestamps e erros

**Formato dos Logs**:
```
[CRON] Starting scheduled update job...
[CRON] Generating artists...
[CRON] ✅ Saved artist: Nome do Artista
[CRON] Generating news...
[CRON] ✅ Saved news: Título da Notícia
[CRON] Syncing filmographies...
[CRON] ✅ Synced 3 filmographies
[CRON] Updating trending scores...
[CRON] ✅ Trending scores updated
[CRON] ✅ Job completed in 12.3s
[CRON] Updates: 7, Errors: 0
```

### Response JSON

Sucesso (200):
```json
{
  "success": true,
  "duration": 12345,
  "results": {
    "artists": { "updated": 2, "errors": [] },
    "news": { "updated": 2, "errors": [] },
    "filmography": { "synced": 3, "errors": [] },
    "trending": { "updated": 1, "errors": [] }
  },
  "timestamp": "2026-02-04T20:00:00.000Z"
}
```

Erro (401/500):
```json
{
  "success": false,
  "error": "Unauthorized / Error message",
  "duration": 234,
  "timestamp": "2026-02-04T20:00:00.000Z"
}
```

### Slack Notifications (Opcional)

Se configurado, o sistema envia notificações automáticas para Slack com:
- Número de atualizações
- Erros encontrados
- Duração da execução

Configure via variáveis de ambiente:
```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

## 🧪 Teste Manual

### Teste Local

```bash
# 1. Configure o .env com CRON_SECRET
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env

# 2. Inicie o servidor
npm run dev

# 3. Teste o endpoint
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/update
```

### Teste em Produção

```bash
# Teste com seu token de produção
curl -H "Authorization: Bearer YOUR_PRODUCTION_CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/update
```

## ⚙️ Configuração Avançada

### Ajustar Frequência

Para executar com frequências diferentes, edite `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update",
      "schedule": "0 */2 * * *"  // A cada 2 horas
    }
  ]
}
```

**Sintaxe Cron**: `minute hour day month weekday`
- `*/15 * * * *` = A cada 15 minutos
- `0 * * * *` = A cada hora (minuto 0)
- `0 */6 * * *` = A cada 6 horas
- `0 0 * * *` = Diariamente à meia-noite
- `0 9,17 * * *` = Às 9h e 17h

### Ajustar Quantidades

Edite `/app/api/cron/update/route.ts`:

```typescript
// Linha ~81: Artistas por execução
const artists = await artistGenerator.generateMultipleArtists(2, {
  // Altere 2 para outro número
});

// Linha ~168: Notícias por execução
const newsItems = await newsGenerator.generateMultipleNews(2, {
  // Altere 2 para outro número
});

// Linha ~216: Filmografias por execução
take: 3,  // Altere 3 para outro número
```

## 🐛 Troubleshooting

### Problema: Cron não está executando

**Soluções**:
1. Verifique se `vercel.json` está no root do projeto
2. Confirme que fez redeploy após adicionar vercel.json
3. Verifique Vercel Dashboard → Cron Jobs para status
4. Confirme que está em um plano que suporta Cron (Hobby ou superior)

### Problema: 401 Unauthorized

**Soluções**:
1. Verifique se `CRON_SECRET` está configurado na Vercel
2. Confirme que o token no header/query está correto
3. Se usando query param, use `?token=` (não `?cron_secret=`)

### Problema: 500 Internal Server Error

**Soluções**:
1. Verifique logs da Vercel para erro específico
2. Confirme que pelo menos uma API key de AI está configurada
3. Verifique se `DATABASE_URL` está configurado corretamente
4. Confirme que o banco de dados está acessível

### Problema: Atualizações não aparecem

**Soluções**:
1. Verifique logs para ver se houve erros
2. Confirme que os itens gerados não são duplicatas (sistema evita duplicação)
3. Verifique se o banco de dados tem espaço/limites
4. Force uma atualização manual via POST

## 📈 Métricas Esperadas

Com configuração padrão (a cada 15 minutos):

**Por Hora**:
- 8 novos artistas
- 8 novas notícias
- ~12 filmografias atualizadas
- 4 atualizações de trending scores

**Por Dia**:
- ~190 novos artistas
- ~190 novas notícias
- ~288 filmografias atualizadas

**Custo Estimado** (APIs de AI):
- Gemini: ~$0.10-0.20/dia
- OpenAI: ~$0.50-1.00/dia
- Claude: ~$1.00-2.00/dia

## 🔧 Manutenção

### Desabilitar Temporariamente

**Vercel**:
1. Dashboard → Project → Cron Jobs
2. Pause o cron job

**GitHub Actions**:
1. Adicione ao workflow: `if: false` na linha do schedule

**Serviço Externo**:
1. Pause/desabilite o job no painel do serviço

### Monitorar Saúde

1. Configure alertas no Slack
2. Use UptimeRobot para monitorar endpoint
3. Verifique logs regularmente
4. Monitore uso de APIs de AI

## 📚 Referências

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [GitHub Actions Schedule](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Cron Syntax](https://crontab.guru/)
- [Cron-job.org](https://cron-job.org/)
