# 🔄 Workflow de Desenvolvimento Seguro - HallyuHub

> **⚠️ IMPORTANTE:** Este projeto possui proteções de branch **JÁ CONFIGURADAS** no GitHub.
> A branch `main` **NÃO permite push direto** - apenas via Pull Request aprovado.
> A branch `staging` **NÃO permite force push ou deleção**.
> Siga este workflow para trabalhar de forma segura.

## 🎯 Filosofia

**Nunca envie código não testado para produção.**

Todo código deve passar por 3 ambientes:
1. **Local** - Desenvolvimento e testes unitários
2. **Staging** - Testes de integração e validação
3. **Production** - Código validado e aprovado

## 🌳 Arquitetura de Branches

**Fluxo protegido com GitHub Branch Protection Rules (ativas):**

```
┌─────────────────────────────────────────────────────────┐
│  Local Development                                       │
│  ├─ feature/nova-funcionalidade                         │
│  ├─ fix/correcao-bug                                    │
│  └─ refactor/melhoria-codigo                            │
└─────────────────────────────────────────────────────────┘
                    │
                    │ git push origin staging ✅ Permitido
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Staging (Homologação) - http://31.97.255.107:3001     │
│  ├─ Deploy automático via GitHub Actions                │
│  ├─ Testes de integração                                │
│  └─ Validação manual                                    │
│  🔒 Protegida: sem force push/deleção                   │
└─────────────────────────────────────────────────────────┘
                    │
                    │ Pull Request (aprovação obrigatória) ⚠️
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Main (Produção) - https://www.hallyuhub.com.br        │
│  ├─ Deploy automático via GitHub Actions                │
│  ├─ Monitoramento contínuo                              │
│  └─ Rollback se necessário                              │
│  🔒 Protegida: push direto BLOQUEADO, requer PR+review  │
└─────────────────────────────────────────────────────────┘
```

## 📋 Fase 1: Desenvolvimento Local

### 1.1 Setup Inicial

```bash
# Clone do repositório
git clone https://github.com/uchidate/khub.git
cd khub

# Instalar dependências
npm install

# Configurar ambiente local
cp .env.example .env.local

# Configurar banco de dados local
npx prisma generate
npx prisma migrate dev
```

### 1.2 Criar Feature Branch

```bash
# Sempre partir de staging (não de main!)
git checkout staging
git pull origin staging

# Criar feature branch
git checkout -b feature/minha-funcionalidade

# Convenção de nomes:
# - feature/nome-da-funcionalidade
# - fix/descricao-do-bug
# - refactor/nome-da-melhoria
# - docs/nome-da-doc
```

### 1.3 Desenvolvimento com Validação Contínua

```bash
# Terminal 1: Rodar aplicação
npm run dev
# Acesse: http://localhost:3000

# Terminal 2: Rodar type check em watch mode
npm run type-check:watch

# Terminal 3: Rodar testes (quando tiver)
npm run test:watch
```

### 1.4 Validação Pré-Commit

**Antes de cada commit, executar:**

```bash
# 1. Type check
npm run type-check
# ✅ Deve passar sem erros

# 2. Linting
npm run lint
# ✅ Deve passar sem warnings críticos (máx 10 warnings)

# 3. Build
npm run build
# ✅ Deve buildar com sucesso

# 4. Testes (quando implementados)
npm run test
# ✅ Todos os testes devem passar
```

### 1.5 Commit com Validação Automática

```bash
# Adicionar mudanças
git add .

# Commit (pre-commit hook valida automaticamente)
git commit -m "feat(escopo): descrição clara"

# O pre-commit hook vai:
# 1. ✅ Verificar secrets
# 2. ✅ Validar TypeScript (se houver .ts/.tsx modificados)
# 3. ❌ Bloquear se houver erros
```

### 1.6 Checklist Pré-Push

**Antes de fazer push, verificar:**

- [ ] Código compila sem erros
- [ ] Sem warnings de TypeScript
- [ ] ESLint passou (máx 10 warnings)
- [ ] Funcionalidade testada manualmente
- [ ] Não há console.log desnecessários
- [ ] Não há código comentado
- [ ] Documentação atualizada (se necessário)

## 📋 Fase 2: Deploy para Staging

### 2.1 Merge para Staging

```bash
# Garantir que staging está atualizado
git checkout staging
git pull origin staging

# Merge da feature
git merge feature/minha-funcionalidade

# Resolver conflitos se houver
# Testar novamente localmente após merge
npm run build
```

### 2.2 Push para Staging (Deploy Automático)

```bash
# Push vai disparar GitHub Actions
git push origin staging

# O pre-push hook vai:
# 1. ✅ TypeScript type check
# 2. ✅ ESLint
# 3. ✅ Build Next.js
# ❌ Bloqueia se houver erros
```

### 2.3 GitHub Actions (Automático)

O workflow vai executar:

```yaml
1. Validação de Código
   ├─ TypeScript type check
   ├─ ESLint (máx 10 warnings)
   └─ Build Next.js

2. Build Docker
   ├─ Build da imagem
   ├─ Tag: staging
   └─ Push para ghcr.io

3. Deploy Staging
   ├─ Pull imagem no servidor
   ├─ Down containers antigos
   ├─ Up novos containers
   ├─ Aplicar migrations
   └─ Health check

4. Notificações
   └─ Slack: Deploy concluído
```

### 2.4 Validação em Staging

**URL:** http://31.97.255.107:3001

**Checklist de Validação:**

- [ ] Aplicação carrega sem erros
- [ ] Funcionalidade nova funciona
- [ ] Funcionalidades existentes não quebraram
- [ ] Performance aceitável
- [ ] UI/UX conforme esperado
- [ ] Mobile responsivo
- [ ] Sem erros no console do browser

**Ver logs se necessário:**

```bash
# Logs da aplicação
ssh root@31.97.255.107 "docker-compose -f docker-compose.staging.yml logs -f --tail=100 hallyuhub-staging"

# Status dos containers
ssh root@31.97.255.107 "docker-compose -f docker-compose.staging.yml ps"
```

### 2.5 Testes de Integração

**Cenários críticos para testar:**

1. **Autenticação**
   - [ ] Login funciona
   - [ ] Registro funciona
   - [ ] Logout funciona
   - [ ] Reset de senha funciona

2. **Painel Admin** (se você for admin)
   - [ ] Dashboard carrega
   - [ ] CRUD de usuários funciona
   - [ ] CRUD de artistas funciona
   - [ ] CRUD de notícias funciona

3. **Funcionalidades Principais**
   - [ ] Navegação funciona
   - [ ] Busca funciona
   - [ ] Favoritos funcionam
   - [ ] Imagens carregam

## 📋 Fase 3: Deploy para Production

### 3.1 Criar Pull Request

```bash
# Via CLI
gh pr create \
  --base main \
  --head staging \
  --title "Release: Descrição das mudanças" \
  --body "$(cat <<'EOF'
## 📦 Mudanças

- Lista das funcionalidades adicionadas
- Bugs corrigidos
- Melhorias implementadas

## ✅ Validação em Staging

- [x] Todos os testes passaram
- [x] Funcionalidades validadas manualmente
- [x] Performance verificada
- [x] Sem erros críticos

## 🧪 Test Plan

- [ ] Testar autenticação
- [ ] Testar funcionalidade X
- [ ] Verificar mobile

## 📸 Screenshots (se relevante)

[adicionar screenshots]
EOF
)"

# Ou via GitHub UI
# https://github.com/uchidate/khub/compare/main...staging
```

### 3.2 Validações Automáticas do PR

**Proteções ativas na branch `main`:**

O GitHub vai executar automaticamente graças às proteções já configuradas:

```yaml
✅ Validate Code (Status Check)
   ├─ TypeScript type check
   ├─ ESLint
   └─ Build Next.js

✅ Branch Protection Rules (Já Ativas)
   ├─ Require 1 approval
   ├─ Require conversation resolution
   └─ Require status checks to pass
```

**Resultado:** Seu PR **NÃO poderá** ser mergeado até que todas essas condições sejam atendidas.

### 3.3 Revisão de Código

**Reviewer deve verificar:**

- [ ] Código segue padrões do projeto
- [ ] Sem vulnerabilidades de segurança
- [ ] Performance não degradou
- [ ] Documentação adequada
- [ ] Testes cobrem casos importantes
- [ ] Commits bem descritos

**Aprovar o PR:**

```bash
# Via CLI
gh pr review 24 --approve --body "LGTM! ✅"

# Ou via GitHub UI
# Clicar em "Approve" na página do PR
```

### 3.4 Merge para Main

```bash
# Via CLI (squash merge recomendado)
gh pr merge 24 --squash --delete-branch

# Ou via GitHub UI
# Clicar em "Squash and merge"
```

### 3.5 GitHub Actions - Deploy Production (Automático)

```yaml
1. Validação de Código (novamente)

2. Build Docker
   ├─ Build da imagem
   ├─ Tag: latest
   └─ Push para ghcr.io

3. Deploy Production
   ├─ Pull imagem no servidor
   ├─ Down containers antigos
   ├─ Up novos containers
   ├─ Aplicar migrations (se houver)
   ├─ Verificar health
   └─ Verificar SSL

4. Notificações
   └─ Slack: Deploy em produção concluído
```

### 3.6 Validação Pós-Deploy

**URL:** https://www.hallyuhub.com.br

**Checklist Pós-Deploy:**

- [ ] Site carrega (HTTP 200)
- [ ] SSL válido (HTTPS)
- [ ] Health check passou
- [ ] Funcionalidade nova em produção
- [ ] Sem erros críticos nos logs
- [ ] Performance normal

**Monitoramento:**

```bash
# Ver logs de produção (apenas leitura!)
ssh root@31.97.255.107 "docker-compose -f docker-compose.prod.yml logs -f --tail=50 hallyuhub"

# Status dos containers
ssh root@31.97.255.107 "docker-compose -f docker-compose.prod.yml ps"
```

## 🚨 Cenários de Emergência

### Hotfix Crítico

```bash
# 1. Criar hotfix branch a partir de main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix rápido
# ... fazer mudanças ...

# 3. Testar localmente
npm run build

# 4. Commit
git add .
git commit -m "fix: critical bug description"

# 5. Push para staging PRIMEIRO
git checkout staging
git merge hotfix/critical-bug
git push origin staging

# 6. Validar em staging rapidamente

# 7. PR para main
gh pr create --base main --head staging --title "Hotfix: bug description"

# 8. Aprovar e merge imediato
gh pr merge --squash
```

### Rollback

```bash
# 1. Identificar último commit bom
git log --oneline

# 2. Revert via GitHub UI
# https://github.com/uchidate/khub/commits/main
# Clicar em "..." → "Revert commit"

# 3. Merge do revert PR imediatamente
```

## 📊 Proteções Configuradas no GitHub

> **✅ ESTAS PROTEÇÕES JÁ ESTÃO ATIVAS E FUNCIONANDO**
>
> As regras abaixo **não precisam ser configuradas** - elas já foram implementadas no GitHub.
> Esta seção documenta o que está em vigor para que você entenda o comportamento do repositório.

### Branch `main` (Produção)

```yaml
Proteções:
  required_status_checks: ["Validate Code"]
  required_approvals: 1
  require_conversation_resolution: true
  enforce_admins: true
  allow_force_pushes: false
  allow_deletions: false

Resultado:
  ✅ Push direto bloqueado
  ✅ Requer PR aprovado
  ✅ Requer checks passando
  ✅ Aplica regras aos admins
```

### Branch `staging` (Homologação)

```yaml
Proteções:
  enforce_admins: true
  allow_force_pushes: false
  allow_deletions: false

Resultado:
  ⚠️ Push direto permitido (mas não recomendado)
  ✅ Force push bloqueado
  ✅ Aplica regras aos admins
```

## 🎯 Melhores Práticas

### DO ✅

1. **Sempre testar localmente** antes de push
2. **Validar em staging** antes de PR
3. **Escrever commits claros** (feat/fix/refactor/docs)
4. **Pequenos PRs** (mais fáceis de revisar)
5. **Resolver conflitos** antes de merge
6. **Documentar decisões** importantes
7. **Pedir ajuda** se tiver dúvidas

### DON'T ❌

1. **Push direto para main** (✅ já bloqueado pelo GitHub)
2. **Force push em staging** (✅ já bloqueado pelo GitHub)
3. **Skip validações** (--no-verify)
4. **Commitar secrets** (senhas, tokens)
5. **PRs gigantes** (difíceis de revisar)
6. **Merge com conflitos** não resolvidos
7. **Deploy sem testar** em staging
8. **Modificar servidor** via SSH

## 🛠️ Ferramentas Auxiliares

### Script de Validação Local

Criar arquivo `.local/validate.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Validando código..."

echo "1/3 TypeScript..."
npm run type-check

echo "2/3 ESLint..."
npm run lint

echo "3/3 Build..."
npm run build

echo "✅ Tudo OK! Pronto para commit."
```

```bash
chmod +x .local/validate.sh
./.local/validate.sh
```

### Alias Úteis

Adicionar no `.bashrc` ou `.zshrc`:

```bash
# HallyuHub aliases
alias khub-validate="npm run type-check && npm run lint && npm run build"
alias khub-staging="ssh root@31.97.255.107 'docker-compose -f docker-compose.staging.yml logs -f --tail=50 hallyuhub-staging'"
alias khub-prod="ssh root@31.97.255.107 'docker-compose -f docker-compose.prod.yml logs -f --tail=50 hallyuhub'"
```

## 📚 Recursos

- [CONTRIBUTING.md](CONTRIBUTING.md) - Guia de contribuição
- [WORKFLOW.md](WORKFLOW.md) - Workflow detalhado
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) - Pipeline CI/CD

## 🎓 Resumo Visual

```
┌──────────────────────────────────────────────────────────┐
│  1. LOCAL                                                 │
│     - Desenvolver                                         │
│     - npm run type-check                                  │
│     - npm run lint                                        │
│     - npm run build                                       │
│     - git commit (pre-commit hook valida)                 │
│     ✅ Tudo passou? → Push para staging                   │
└──────────────────────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────┐
│  2. STAGING                                               │
│     - GitHub Actions: build & deploy                      │
│     - Testar em http://31.97.255.107:3001               │
│     - Validar funcionalidades                             │
│     - Verificar logs                                      │
│     ✅ Tudo OK? → Criar PR para main                      │
└──────────────────────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────┐
│  3. PULL REQUEST                                          │
│     - Validações automáticas (TypeScript, ESLint, Build) │
│     - Aguardar 1 aprovação                                │
│     - Resolver conversas                                  │
│     ✅ Aprovado? → Merge para main                        │
└──────────────────────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────┐
│  4. PRODUCTION                                            │
│     - GitHub Actions: build & deploy                      │
│     - Deploy em https://www.hallyuhub.com.br             │
│     - Health checks automáticos                           │
│     - Monitoramento contínuo                              │
│     ✅ Deploy concluído! 🎉                               │
└──────────────────────────────────────────────────────────┘
```

---

**🔒 Lembre-se:** Cada fase é uma barreira de segurança. Não pule etapas!
