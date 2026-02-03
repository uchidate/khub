# Scripts de Gerenciamento - HallyuHub

Esta pasta contém scripts robustos para gerenciar versões, deployments e monitoramento do HallyuHub.

## 📋 Índice

- [Verificação de Versões](#verificação-de-versões)
- [Validação Pré-Deploy](#validação-pré-deploy)
- [Gerenciamento de Versões](#gerenciamento-de-versões)
- [Monitoramento](#monitoramento)
- [Rollback](#rollback)
- [Health Check](#health-check)

---

## 🔍 Verificação de Versões

### Script Principal (Recomendado)

```bash
# Verifica versões em TODOS os ambientes (local, staging, production)
./scripts/version-check/check-all-versions.sh
```

Este é o script mais completo e fornece:
- Versão local e branch atual
- Comparação com staging (develop) e production (main)
- Health checks automáticos
- Análise de consistência entre ambientes

### Scripts Individuais

```bash
# Apenas versão local
./scripts/version-check/check-local-version.sh

# Apenas staging
./scripts/version-check/check-staging-version.sh

# Apenas production
./scripts/version-check/check-production-version.sh

# Verificar no servidor (requer SSH configurado)
export SSH_USER=seu-usuario
./scripts/version-check/check-server-versions.sh
```

---

## ✅ Validação Pré-Deploy

Execute ANTES de fazer qualquer deploy para garantir que tudo está correto:

```bash
./scripts/pre-deploy-validation.sh
```

Este script verifica:
- ✓ Git (branch, commits, mudanças não salvas)
- ✓ Dependências (node_modules, vulnerabilidades)
- ✓ Build (compila o projeto)
- ✓ Versão (package.json, tags git)
- ✓ Docker (Dockerfile, docker-compose)
- ✓ Ambiente (.env files)
- ✓ Testes (se configurados)
- ✓ Segurança (.gitignore, arquivos sensíveis)

**Exit codes:**
- `0` = Tudo OK ou apenas avisos
- `1` = Erros encontrados (corrija antes de fazer deploy)

---

## 📦 Gerenciamento de Versões

### Atualizar Versão Automaticamente

```bash
./scripts/bump-version.sh
```

Opções disponíveis:
1. **Patch** (1.0.0 → 1.0.1) - Para correções de bugs
2. **Minor** (1.0.0 → 1.1.0) - Para novas funcionalidades
3. **Major** (1.0.0 → 2.0.0) - Para mudanças incompatíveis
4. **Custom** - Especificar manualmente

O script automaticamente:
- Atualiza [v1/package.json](../v1/package.json)
- Cria commit com mensagem padronizada
- Cria tag git (opcional)
- Fornece instruções para push

**Exemplo de uso:**
```bash
./scripts/bump-version.sh
# Seleciona opção 1 (Patch)
# Nova versão: 1.0.1
# Confirma: y
# Tag criada: v1.0.1

# Depois:
git push origin main
git push origin v1.0.1
```

---

## 📊 Monitoramento

### Monitoramento Contínuo

```bash
./scripts/monitor.sh
```

Monitora staging e production continuamente:
- Verifica health a cada 30 segundos
- Salva logs em `monitor.log`
- Mostra status em tempo real
- Detecta timeouts e erros

**Para parar:** Pressione `Ctrl+C`

**Customizar intervalo:**
```bash
# Edite a linha CHECK_INTERVAL no script
# Padrão: 30 segundos
```

**Integração com alertas:**
Edite a função `send_alert()` em [monitor.sh](monitor.sh) para integrar com:
- Slack
- Discord
- Email
- Telegram
- Etc.

---

## 🔄 Rollback

Em caso de problemas após deploy:

```bash
./scripts/rollback.sh
```

**Opções de rollback:**

1. **Rollback para imagem Docker anterior**
   - Lista imagens disponíveis no servidor
   - Permite escolher qualquer versão
   - Opção "previous" para voltar 1 versão

2. **Rollback para tag/commit Git específico**
   - Lista últimas tags disponíveis
   - Cria branch temporária
   - Fornece instruções para re-deploy

3. **Apenas reiniciar container**
   - Útil para problemas temporários
   - Não muda versão

**Requer:** Acesso SSH configurado

```bash
export SSH_USER=seu-usuario
./scripts/rollback.sh
```

---

## 🏥 Health Check

### Health Check Detalhado

```bash
./scripts/health-check.sh
```

Verifica 6 aspectos de cada ambiente:

1. ✓ Conectividade básica
2. ✓ Endpoint `/api/health`
3. ✓ Tempo de resposta
4. ✓ JSON response válido
5. ✓ Headers corretos
6. ✓ SSL/TLS (se HTTPS)

**Exit codes:**
- `0` = Todos os ambientes online
- `1` = Pelo menos um ambiente offline

**Útil para:**
- CI/CD pipelines
- Smoke tests
- Scripts automatizados

**Exemplo em CI:**
```yaml
- name: Verify deployment
  run: ./scripts/health-check.sh
```

---

## 🚀 Workflow Completo de Deploy

### 1. Desenvolvimento Local

```bash
# Trabalhe em sua feature
git checkout -b feature/nova-funcionalidade

# Faça commits
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

### 2. Preparação para Deploy

```bash
# Atualiza versão (se necessário)
./scripts/bump-version.sh

# Valida antes de fazer merge
./scripts/pre-deploy-validation.sh

# Se tudo OK, faz merge para develop (staging)
git checkout develop
git merge feature/nova-funcionalidade
git push origin develop
```

### 3. Deploy Automático (GitHub Actions)

O GitHub Actions vai automaticamente:
- Build da imagem Docker
- Push para GitHub Container Registry
- Deploy no servidor staging

### 4. Verificação

```bash
# Verifica todas as versões
./scripts/version-check/check-all-versions.sh

# Health check detalhado
./scripts/health-check.sh

# Monitoramento contínuo (opcional)
./scripts/monitor.sh
```

### 5. Deploy para Produção

```bash
# Depois de testar em staging
git checkout main
git merge develop
git push origin main

# Aguarda deploy automático e verifica
./scripts/health-check.sh
```

### 6. Se algo der errado

```bash
# Rollback rápido
./scripts/rollback.sh
```

---

## ⚙️ Configuração

### SSH (Obrigatório para alguns scripts)

```bash
# 1. Gera chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu-email@example.com"

# 2. Copia chave para o servidor
ssh-copy-id seu-usuario@31.97.255.107

# 3. Testa conexão
ssh seu-usuario@31.97.255.107 "echo 'Conexão OK'"

# 4. Configura variável de ambiente (opcional)
export SSH_USER=seu-usuario
# Ou adicione ao ~/.bashrc ou ~/.zshrc:
echo 'export SSH_USER=seu-usuario' >> ~/.bashrc
```

### Dependências

Os scripts usam as seguintes ferramentas:

**Obrigatórias:**
- `bash` (já vem instalado)
- `git`
- `curl`

**Opcionais (mas recomendadas):**
- `jq` - Para parsing de JSON
  ```bash
  # macOS
  brew install jq

  # Ubuntu/Debian
  sudo apt-get install jq
  ```

- `bc` - Para cálculos matemáticos
  ```bash
  # macOS (já vem instalado)
  # Ubuntu/Debian
  sudo apt-get install bc
  ```

- `gh` - GitHub CLI (para workflows)
  ```bash
  # macOS
  brew install gh

  # Ubuntu/Debian
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt update
  sudo apt install gh
  ```

---

## 📝 Logs

Os scripts geram logs em:

- `monitor.log` - Logs do monitoramento contínuo
- `/tmp/build.log` - Logs de build (pré-deploy validation)

---

## 🔒 Segurança

### Boas Práticas

1. **Nunca commite credenciais**
   - Use variáveis de ambiente
   - Mantenha `.env` no `.gitignore`

2. **Use SSH keys, não senhas**
   - Mais seguro
   - Permite automação

3. **Revise antes de fazer rollback**
   - Rollbacks podem ser disruptivos
   - Sempre confirme antes de executar

4. **Monitore regularmente**
   - Execute health checks
   - Configure alertas

---

## 🆘 Troubleshooting

### Erro: "Permission denied"

```bash
chmod +x scripts/*.sh
chmod +x scripts/version-check/*.sh
```

### Erro: "SSH connection failed"

```bash
# Verifique conectividade
ping 31.97.255.107

# Teste SSH
ssh seu-usuario@31.97.255.107

# Configure SSH_USER
export SSH_USER=seu-usuario
```

### Erro: "jq: command not found"

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### Health check retorna HTTP 000

Possíveis causas:
- Servidor offline
- Firewall bloqueando
- Timeout (servidor lento)

Solução:
```bash
# Aumenta timeout
# Edite TIMEOUT=10 para TIMEOUT=30 em health-check.sh
```

---

## 📚 Documentação Adicional

- [Guia de Verificação de Versões](../VERIFICACAO-VERSOES.md) - Documentação completa
- [README principal](../README.md) - Guia do projeto

---

## 🤝 Contribuindo

Para adicionar novos scripts:

1. Crie o script em `scripts/`
2. Adicione permissões: `chmod +x scripts/seu-script.sh`
3. Documente neste README
4. Siga o padrão de:
   - Cores para output
   - Validações de pré-requisitos
   - Mensagens de erro claras
   - Exit codes apropriados

---

## 📄 Licença

Mesma licença do projeto principal.
