# 🚀 Guia Rápido: Deploy do Sistema de Cron

## ⚡ Setup em 5 Minutos

### 1. Configure as Variáveis de Ambiente na Vercel

Acesse: **Vercel Dashboard → Project → Settings → Environment Variables**

Adicione:

```bash
# OBRIGATÓRIO
CRON_SECRET=<gere um token: openssl rand -hex 32>

# Pelo menos uma dessas (para geração de conteúdo)
GEMINI_API_KEY=<sua chave Gemini>
OPENAI_API_KEY=<sua chave OpenAI>
ANTHROPIC_API_KEY=<sua chave Anthropic>

# OPCIONAL (notificações)
SLACK_WEBHOOK_URL=<seu webhook Slack>
```

### 2. Deploy o Código

```bash
git add .
git commit -m "feat: adicionar sistema de cron para atualização automática"
git push origin main
```

**A Vercel detectará automaticamente** o `vercel.json` e configurará o cron job.

### 3. Verifique o Cron

1. Acesse: **Vercel Dashboard → Project → Cron Jobs**
2. Você verá: `/api/cron/update` executando a cada 15 minutos
3. Aguarde 15 minutos ou force uma execução manual

### 4. Teste Manual (Opcional)

```bash
# Obtenha seu CRON_SECRET da Vercel
# Dashboard → Settings → Environment Variables → CRON_SECRET

curl -X POST \
  -H "Authorization: Bearer SEU_CRON_SECRET_AQUI" \
  https://seu-dominio.vercel.app/api/cron/update
```

Resposta esperada:
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

## 📊 O Que Esperar

### Primeira Execução
- Demora ~30-60 segundos
- Gera 2 artistas + 2 notícias
- Sincroniza 3 filmografias
- Atualiza trending scores

### Execuções Subsequentes
- A cada 15 minutos automaticamente
- ~8 artistas/hora, ~8 notícias/hora
- ~190 artistas/dia, ~190 notícias/dia

### Onde Ver os Resultados
- **Logs**: Vercel Dashboard → Logs → Filtre `/api/cron/update`
- **Banco**: Novos registros nas tabelas `Artist`, `News`, `Production`
- **Site**: Novo conteúdo visível imediatamente

## 🔍 Troubleshooting

### ❌ Cron não aparece no Dashboard
**Solução**: Faça redeploy. O `vercel.json` só é lido no deploy.

### ❌ 401 Unauthorized
**Solução**: Verifique se `CRON_SECRET` está configurado nas variáveis de ambiente.

### ❌ 500 Internal Server Error
**Soluções**:
1. Verifique se pelo menos uma API key está configurada
2. Confirme `DATABASE_URL` está correto
3. Veja logs detalhados na Vercel

### ❌ Nenhum conteúdo novo
**Soluções**:
1. Verifique logs para erros
2. Confirme que as APIs de IA estão respondendo
3. O sistema evita duplicatas - pode ser que já existam artistas similares

## 📈 Monitoramento

### Logs em Tempo Real

```bash
# CLI da Vercel
vercel logs --follow

# Filtre por cron
vercel logs | grep CRON
```

### Métricas

Configure alertas para:
- Taxa de erro > 10%
- Duração > 60 segundos
- Falhas consecutivas > 3

## 💰 Custos

### Vercel
- **Hobby**: Gratuito (máximo 2 cron jobs)
- **Pro**: $20/mês (cron ilimitado)

### APIs de IA (por dia)
- **Gemini**: ~$0.10-0.20
- **OpenAI**: ~$0.50-1.00
- **Claude**: ~$1.00-2.00

**Total Estimado**: ~$0.50-2.50/dia = ~$15-75/mês

## 🎯 Próximos Passos

1. ✅ Deploy e configuração inicial
2. ⏳ Aguarde 15 minutos e verifique logs
3. ✅ Confirme novo conteúdo no site
4. ✅ Configure notificações Slack (opcional)
5. ✅ Ajuste frequência se necessário

## 📚 Documentação Completa

Ver: [docs/CRON_SETUP.md](./CRON_SETUP.md)
