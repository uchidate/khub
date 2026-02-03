# Configuração de GitHub Secrets

Este documento explica como configurar os secrets necessários para o GitHub Actions.

## Secrets Necessários

### 1. Secrets de Deploy (já configurados)

- `HOST` - Endereço do servidor
- `USER` - Usuário SSH
- `SSH_PRIVATE_KEY` - Chave privada SSH

### 2. Slack Webhook (NOVO - necessário configurar)

- `SLACK_WEBHOOK_DEPLOYS` - Webhook para notificações de deploy

## Como Adicionar o Secret SLACK_WEBHOOK_DEPLOYS

### Passo 1: Acessar Configurações do Repositório

1. Acesse o repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** > **Actions**

### Passo 2: Adicionar Novo Secret

1. Clique no botão **New repository secret**
2. Em **Name**, digite: `SLACK_WEBHOOK_DEPLOYS`
3. Em **Secret**, cole o webhook URL do Slack (obtido em https://api.slack.com/apps)
4. Clique em **Add secret**

### Passo 3: Verificar Configuração

Após adicionar, você verá o secret listado como:

```
SLACK_WEBHOOK_DEPLOYS ••••••••
```

## Como Funciona

### Deploy para Staging (develop branch)

Quando você faz push para `develop`:

1. **Notificação de início** - Slack recebe aviso que deploy iniciou
2. **Build e Deploy** - GitHub Actions executa o deploy
3. **Notificação de sucesso/falha** - Slack recebe resultado do deploy

### Deploy para Production (main branch)

Quando você faz merge para `main`:

1. **Notificação de início** - Slack recebe aviso que deploy iniciou
2. **Build e Deploy** - GitHub Actions executa o deploy
3. **Notificação de sucesso/falha** - Slack recebe resultado do deploy

## Formato das Notificações

### Notificação de Início

```
🟡 Deploy STAGING Iniciado
(ou)
🟢 Deploy PRODUCTION Iniciado

Ambiente: Staging (:3001) / Production (:3000)
Branch: develop / main
Commit: [hash do commit]
Autor: [seu usuário GitHub]

[Link para o workflow]
```

### Notificação de Sucesso

```
✅ Deploy STAGING Concluído
(ou)
✅ Deploy PRODUCTION Concluído

[Mesmas informações acima]

Próximos passos: (staging)
1. Validar em staging
2. Criar PR: develop → main

Aplicação em produção atualizada! (production)
Disponível em: http://servidor:3000
```

### Notificação de Falha

```
❌ Deploy STAGING Falhou
(ou)
❌ Deploy PRODUCTION Falhou

[Mesmas informações acima]

⚠️ ATENÇÃO: Deploy em produção falhou!
Verifique os logs imediatamente.

[Link para os logs do workflow]
```

## Testando a Configuração

Após adicionar o secret:

1. **Faça um commit** em qualquer arquivo
2. **Push para develop**:
   ```bash
   git add .
   git commit -m "test: verificar notificações Slack"
   git push origin develop
   ```
3. **Verifique o Slack** - você deve receber 3 notificações:
   - Deploy iniciado
   - Deploy concluído (ou falhou)

## Troubleshooting

### Não recebo notificações

1. **Verificar se o secret está configurado:**
   - Settings > Secrets and variables > Actions
   - Deve existir `SLACK_WEBHOOK_DEPLOYS`

2. **Verificar o webhook no Slack:**
   - Acesse: https://api.slack.com/apps
   - Verifique se o webhook está ativo

3. **Verificar logs do GitHub Actions:**
   - Actions > Selecione o workflow
   - Verifique se há erros nos steps de notificação

### Webhook inválido ou expirado

Se o webhook parar de funcionar:

1. **Gerar novo webhook no Slack:**
   - https://api.slack.com/apps
   - Incoming Webhooks > Add New Webhook to Workspace

2. **Atualizar o secret no GitHub:**
   - Settings > Secrets and variables > Actions
   - Clique em `SLACK_WEBHOOK_DEPLOYS`
   - Update secret com o novo URL

## Canais Slack

As notificações são enviadas para:

- **#hallyuhub-deploys** - Notificações de deploy (este webhook)
- **#hallyuhub-content** - Conteúdo gerado automaticamente
- **#hallyuhub-alerts** - Alertas de sistema

## Referências

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Deploy Workflow](../.github/workflows/deploy-image.yml)
