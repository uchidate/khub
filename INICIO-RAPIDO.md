# 🚀 Início Rápido - Gerenciamento de Versões

Este guia mostra como usar os scripts de forma rápida e eficiente.

## ⚡ Comandos Mais Usados

### Método 1: Menu Interativo (Recomendado para iniciantes)

```bash
./scripts/menu.sh
```

Um menu interativo com todas as opções disponíveis. Basta escolher o número da operação desejada.

### Método 2: Makefile (Recomendado para uso diário)

```bash
# Ver todos os comandos disponíveis
make help

# Comandos mais comuns:
make check          # Verificação rápida de tudo
make validate       # Validação completa pré-deploy
make health         # Health check detalhado
make monitor        # Monitoramento contínuo
```

### Método 3: Scripts Diretos

```bash
# Verificação rápida
./scripts/quick-check.sh

# Verificação completa
./scripts/version-check/check-all-versions.sh

# Validação pré-deploy
./scripts/pre-deploy-validation.sh
```

---

## 📋 Workflows Comuns

### 1️⃣ Começar o Dia

```bash
make check
# ou
./scripts/quick-check.sh
```

Verifica rapidamente:
- ✓ Status do git
- ✓ Versão local
- ✓ Staging e Production online
- ✓ Sincronização com remote

---

### 2️⃣ Antes de Fazer Deploy

```bash
make validate
# ou
./scripts/pre-deploy-validation.sh
```

Valida:
- ✓ Git limpo e sincronizado
- ✓ Dependências atualizadas
- ✓ Build funcionando
- ✓ Testes passando
- ✓ Segurança (.env não commitado)

---

### 3️⃣ Verificar Versões em Todos os Ambientes

```bash
make check-all
# ou
./scripts/version-check/check-all-versions.sh
```

Compara:
- Local vs Staging vs Production
- Commits em cada ambiente
- Status de sincronização

---

### 4️⃣ Atualizar Versão do Projeto

```bash
make bump-version
# ou
./scripts/bump-version.sh
```

Escolhe:
1. Patch (1.0.0 → 1.0.1) - Bugs
2. Minor (1.0.0 → 1.1.0) - Features
3. Major (1.0.0 → 2.0.0) - Breaking changes

---

### 5️⃣ Deploy para Staging

```bash
# Com Makefile
make deploy-staging

# Ou manualmente
git checkout develop
git pull origin develop
git merge sua-branch
./scripts/pre-deploy-validation.sh
git push origin develop
```

---

### 6️⃣ Deploy para Production

```bash
# Com Makefile
make deploy-prod

# Ou manualmente
git checkout main
git pull origin main
git merge develop
./scripts/pre-deploy-validation.sh
git push origin main
```

---

### 7️⃣ Verificar Saúde dos Ambientes

```bash
make health
# ou
./scripts/health-check.sh
```

Verifica:
- ✓ Conectividade
- ✓ Endpoint /api/health
- ✓ Tempo de resposta
- ✓ JSON válido
- ✓ Headers corretos

---

### 8️⃣ Monitorar Continuamente

```bash
make monitor
# ou
./scripts/monitor.sh
```

Monitora staging e production a cada 30 segundos.
Pressione Ctrl+C para parar.

---

### 9️⃣ Rollback (Emergência)

```bash
make rollback
# ou
./scripts/rollback.sh
```

Opções:
1. Voltar para imagem Docker anterior
2. Voltar para tag/commit específico
3. Apenas reiniciar container

**Requer SSH configurado**

---

## ⚙️ Configuração Inicial

### 1. Permissões (já configurado)

```bash
chmod +x scripts/*.sh
chmod +x scripts/version-check/*.sh
```

### 2. SSH (para scripts de servidor)

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "seu-email@example.com"

# Copiar para servidor
ssh-copy-id seu-usuario@31.97.255.107

# Configurar variável
export SSH_USER=seu-usuario
echo 'export SSH_USER=seu-usuario' >> ~/.bashrc

# Ou use:
make ssh-setup  # Para ver instruções
```

### 3. Dependências Opcionais

```bash
# macOS
brew install jq bc gh

# Ubuntu/Debian
sudo apt-get install jq bc
```

---

## 🎯 Tabela de Referência Rápida

| Tarefa | Comando Rápido | Tempo |
|--------|---------------|-------|
| Verificação rápida | `make check` | 5s |
| Verificação completa | `make check-all` | 10s |
| Validação pré-deploy | `make validate` | 30s |
| Health check | `make health` | 10s |
| Atualizar versão | `make bump-version` | 1min |
| Deploy staging | `make deploy-staging` | 2min |
| Deploy production | `make deploy-prod` | 2min |
| Rollback | `make rollback` | 1min |

---

## 📱 URLs dos Ambientes

| Ambiente | URL | Branch |
|----------|-----|--------|
| Local | http://localhost:3000 | (qualquer) |
| Staging | http://31.97.255.107:3001 | develop |
| Production | http://31.97.255.107:3000 | main |

---

## 🆘 Ajuda

```bash
# Ver todos os comandos Make
make help

# Menu interativo
./scripts/menu.sh

# Documentação completa
cat VERIFICACAO-VERSOES.md
cat scripts/README.md
```

---

## 💡 Dicas

1. **Use `make check` todo dia** antes de começar a trabalhar
2. **Sempre execute `make validate`** antes de fazer deploy
3. **Configure SSH** para usar scripts de servidor
4. **Monitore após deploy** com `make health` ou `make monitor`
5. **Mantenha branches sincronizadas** com `make git-sync`

---

## 🎓 Exemplos de Uso Real

### Cenário 1: Bug Fix Urgente

```bash
# 1. Verificar estado atual
make check

# 2. Criar branch e corrigir
git checkout -b hotfix/bug-critico
# ... fazer correções ...
git commit -m "fix: corrige bug crítico"

# 3. Validar
make validate

# 4. Deploy para staging primeiro
git checkout develop
git merge hotfix/bug-critico
git push origin develop

# 5. Testar em staging
make health

# 6. Se OK, deploy para production
git checkout main
git merge hotfix/bug-critico
git push origin main

# 7. Monitorar
make monitor
```

### Cenário 2: Nova Feature

```bash
# 1. Criar feature branch
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver localmente
make dev  # Servidor de desenvolvimento

# 3. Quando pronto, atualizar versão
make bump-version  # Escolher Minor

# 4. Validar tudo
make validate

# 5. Merge para develop
git checkout develop
git merge feature/nova-funcionalidade

# 6. Deploy para staging
git push origin develop

# 7. Aguardar GitHub Actions e verificar
sleep 120  # Aguarda deploy
make health

# 8. Testar em staging manualmente
# http://31.97.255.107:3001

# 9. Se OK, merge para main
git checkout main
git merge develop
git push origin main

# 10. Verificar production
make monitor
```

### Cenário 3: Algo deu errado!

```bash
# 1. Verificar o problema
make health

# 2. Ver logs (se tiver SSH)
ssh $SSH_USER@31.97.255.107 "docker logs hallyuhub --tail 50"

# 3. Fazer rollback
make rollback

# 4. Verificar se voltou ao normal
make health

# 5. Investigar problema localmente
git log -5  # Ver últimos commits
git diff HEAD~1  # Ver mudanças do último commit
```

---

## 📖 Documentação Completa

- [VERIFICACAO-VERSOES.md](VERIFICACAO-VERSOES.md) - Guia completo de verificação
- [scripts/README.md](scripts/README.md) - Documentação de todos os scripts
- [README.md](README.md) - README principal do projeto

---

**Dica Final:** Adicione um alias no seu `.bashrc` ou `.zshrc`:

```bash
alias khub-check='cd /caminho/para/khub && make check'
alias khub-menu='cd /caminho/para/khub && ./scripts/menu.sh'
```

Assim você pode executar de qualquer lugar!
