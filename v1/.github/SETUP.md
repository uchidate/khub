# GitHub Actions Setup Guide

Este guia mostra como configurar os GitHub Secrets necessários para os workflows funcionarem.

## Secrets Necessários

Você precisa adicionar 3 secrets no seu repositório GitHub:

### 1. SSH_HOST
- **Valor**: `31.97.255.107`
- **Descrição**: IP do servidor Hostinger

### 2. SSH_USER
- **Valor**: `root`
- **Descrição**: Usuário SSH

### 3. SSH_KEY
- **Valor**: Sua chave privada SSH
- **Como obter**:
  ```bash
  cat ~/.ssh/id_rsa
  ```
  Copie TODO o conteúdo, incluindo:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```

## Como Adicionar Secrets

1. Vá para: https://github.com/uchidate/khub/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Adicione cada secret:
   - Name: `SSH_HOST`
   - Value: `31.97.255.107`
   - Clique em **"Add secret"**
4. Repita para `SSH_USER` e `SSH_KEY`

## Testando os Workflows

### Teste 1: Deploy Automático
1. Faça uma pequena alteração no código
2. Commit e push:
   ```bash
   git add .
   git commit -m "test: trigger CI/CD"
   git push
   ```
3. Vá para: https://github.com/uchidate/khub/actions
4. Veja o workflow rodando

### Teste 2: Geração de Conteúdo (Manual)
1. Vá para: https://github.com/uchidate/khub/actions/workflows/daily-content.yml
2. Clique em **"Run workflow"**
3. Clique em **"Run workflow"** novamente
4. Aguarde a execução

## Workflows Criados

### 1. `deploy.yml` - Deploy Automático
- **Quando**: Ao fazer push na branch `main`
- **O que faz**:
  - Build da aplicação Next.js
  - Build da imagem Docker
  - Push para GitHub Container Registry
  - Deploy no Hostinger
  - Verifica se está funcionando

### 2. `daily-content.yml` - Geração Diária
- **Quando**: Todo dia às 3h da manhã (UTC)
- **O que faz**:
  - Gera 5 notícias
  - Gera 2 artistas
  - Gera 1 produção
  - Usa Ollama (grátis!)
  - Verifica o banco de dados

## Próximos Passos

1. ✅ Adicionar os 3 secrets no GitHub
2. ✅ Fazer um commit para testar o deploy
3. ✅ Testar a geração manual de conteúdo
4. ✅ Aguardar a primeira execução automática (3h da manhã)

## Troubleshooting

### Erro: "Permission denied (publickey)"
- Verifique se o `SSH_KEY` está correto
- Certifique-se de copiar a chave PRIVADA (não a pública)

### Erro: "Docker command not found"
- O servidor precisa ter Docker instalado
- Já está instalado no seu Hostinger

### Workflow não executa
- Verifique se os secrets estão configurados
- Veja os logs em: https://github.com/uchidate/khub/actions
