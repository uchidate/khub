# Notificações Slack

Este sistema envia notificações automáticas para canais do Slack sobre eventos importantes do HallyuHub.

## Canais Recomendados

Configure três canais no seu workspace Slack:

- **#hallyuhub-content** - Novos artistas, notícias, produções adicionadas
- **#hallyuhub-deploys** - Status de deploys (staging/production)
- **#hallyuhub-alerts** - Backups, alertas de saúde, erros

## Configuração

### 1. Criar Incoming Webhooks no Slack

1. Acesse https://api.slack.com/messaging/webhooks
2. Clique em "Create your Slack app" (se ainda não tiver um app)
3. Escolha "From scratch" e dê um nome (ex: "HallyuHub Notifications")
4. Selecione seu workspace
5. Em "Incoming Webhooks", ative a opção
6. Clique em "Add New Webhook to Workspace"
7. Selecione o canal e autorize
8. Copie a Webhook URL gerada
9. Repita para cada canal que deseja notificar

### 2. Configurar Variáveis de Ambiente

Adicione as Webhook URLs no seu arquivo `.env`:

```bash
# Slack Notifications
SLACK_WEBHOOK_CONTENT="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX"
SLACK_WEBHOOK_DEPLOYS="https://hooks.slack.com/services/T00000000/B00000000/YYYYYYYYYYYY"
SLACK_WEBHOOK_ALERTS="https://hooks.slack.com/services/T00000000/B00000000/ZZZZZZZZZZZZ"
```

> **Nota:** As notificações são opcionais. Se não configurar nenhum webhook, o sistema funcionará normalmente sem enviar notificações.

## Eventos Notificados

### Canal: #hallyuhub-content

- **Novo conteúdo adicionado** - Quando um artista, notícia ou produção é criado
- **Resumo de geração em lote** - Ao final do script `atualize-ai.ts`

### Canal: #hallyuhub-deploys

- **Deploy iniciado** - Quando um deploy começa
- **Deploy bem-sucedido** - Quando um deploy é concluído com sucesso
- **Deploy falhou** - Quando um deploy falha (com detalhes do erro)

### Canal: #hallyuhub-alerts

- **Backup bem-sucedido** - Quando um backup do banco é criado
- **Backup falhou** - Quando um backup falha (com detalhes do erro)
- **Alertas de saúde** - Status de serviços (AI providers, banco de dados, etc.)
- **Alertas gerais** - Erros críticos, avisos importantes

## Uso Programático

### Importar o Serviço

```typescript
import { getSlackService } from '@/lib/services/slack-notification-service';

const slack = getSlackService();
```

### Verificar se está Habilitado

```typescript
if (slack.isEnabled()) {
    // Enviar notificação
}
```

### Notificar Novo Conteúdo

```typescript
await slack.notifyContentAdded({
    type: 'artist',
    name: 'NewJeans',
    details: {
        'Membros': '5',
        'Debut': '2022',
    },
    source: 'Manual',
    url: 'https://hallyuhub.com/artists/newjeans'
});
```

### Notificar Deploy

```typescript
await slack.notifyDeploy({
    environment: 'production',
    status: 'success',
    branch: 'main',
    commit: 'abc1234',
    duration: '2m 34s'
});
```

### Notificar Backup

```typescript
await slack.notifyBackup({
    environment: 'production',
    status: 'success',
    size: '156MB',
    retainedCount: 7
});
```

### Notificar Alerta de Saúde

```typescript
await slack.notifyHealthAlert({
    service: 'Gemini AI',
    status: 'down',
    message: 'API key inválida ou expirada'
});
```

### Alerta Genérico

```typescript
await slack.notifyAlert(
    'error',
    'Erro Crítico',
    'Falha ao processar requisição importante'
);
```

## Testando

Para testar as notificações:

```bash
# Teste o script de atualização AI (modo dry-run não envia notificação)
npm run update:ai -- --news 1

# Teste o script de backup (certifique-se de ter Docker rodando)
./scripts/backup-db.sh
```

## Segurança

- **Nunca commite** as URLs dos webhooks no repositório
- Mantenha os webhooks apenas nos arquivos `.env` (ignorados pelo git)
- Em produção, use variáveis de ambiente do sistema ou serviço de secrets
- Monitore o uso dos webhooks no painel do Slack

## Troubleshooting

### Notificações não estão sendo enviadas

1. Verifique se as variáveis estão configuradas: `echo $SLACK_WEBHOOK_CONTENT`
2. Teste a webhook manualmente:
```bash
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"Teste de notificação"}' \
YOUR_WEBHOOK_URL
```
3. Verifique os logs da aplicação para erros

### Webhook retorna erro 404

- A webhook foi revogada ou o app foi removido do workspace
- Crie uma nova webhook seguindo os passos de configuração

### Mensagens formatadas incorretamente

- Verifique se está usando os tipos corretos (`ContentType`, `DeployEnvironment`, etc.)
- Revise a documentação da API do Slack: https://api.slack.com/messaging/webhooks

## Referências

- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Slack Block Kit Builder](https://app.slack.com/block-kit-builder)
- [Código do Serviço](../lib/services/slack-notification-service.ts)
