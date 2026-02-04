# 📋 Processo de Desenvolvimento

## ⚠️ NUNCA MAIS ERROS NO DEPLOY!

Este documento define o processo obrigatório para desenvolvimento para **prevenir erros em produção**.

---

## 🚨 FLUXO OBRIGATÓRIO DE BRANCHES

**LEIA PRIMEIRO:** [DEPLOY_WORKFLOW.md](DEPLOY_WORKFLOW.md)

### ❌ NUNCA FAÇA:
```bash
# Push direto para main
git checkout main
git commit -m "fix"
git push origin main  # ❌ ERRADO!
```

### ✅ SEMPRE FAÇA:
```bash
# 1. Trabalhar em develop ou feature branch
git checkout develop
git commit -m "fix"
git push origin develop  # ✅ Push para develop

# 2. Aguardar deploy staging completar
# Ver: https://github.com/uchidate/khub/actions

# 3. Testar em staging
curl http://31.97.255.107:3001/api/health
open http://31.97.255.107:3001

# 4. Só depois de VALIDAR em staging:
git checkout main
git merge develop  # ✅ Merge validado
git push origin main  # ✅ Deploy production
```

**Resumo**: `develop` → `staging (teste)` → `main` → `production`

---

Este documento define o processo obrigatório para desenvolvimento para **prevenir erros em produção**.

---

## 🔒 Git Hooks Configurados

### Pre-Commit (Rápido - ~10s)
- ✅ Verifica secrets
- ✅ Type-check TypeScript (apenas arquivos modificados)

### Pre-Push (Completo - ~1-2min)
- ✅ Type-check completo
- ✅ ESLint
- ✅ Build test

**Os hooks estão em:** `.git/hooks/pre-commit` e `.git/hooks/pre-push`

---

## 📝 Checklist OBRIGATÓRIO Antes de Commit

```bash
# 1. Verificar TypeScript
npm run typecheck

# 2. Se OK, fazer commit (hook pre-commit valida automaticamente)
git add .
git commit -m "sua mensagem"
```

Se o **pre-commit falhar**, corrija os erros antes de tentar novamente.

---

## 🚀 Checklist OBRIGATÓRIO Antes de Push

```bash
# 1. Validação completa (opcional, mas recomendado)
npm run validate

# 2. Push (hook pre-push valida automaticamente)
git push origin <branch>
```

Se o **pre-push falhar**, corrija os erros antes de tentar novamente.

---

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor local

# Validação Individual
npm run typecheck        # Apenas TypeScript (rápido)
npm run lint             # Apenas ESLint
npm run build            # Apenas build

# Validação Completa
npm run validate         # typecheck + lint + build (recomendado antes de push)

# Database
npm run prisma:generate  # Gera Prisma client
npm run prisma:migrate   # Roda migrations
npm run prisma:seed      # Seed database

# Conteúdo IA
npm run atualize:ai      # Gera conteúdo com IA
```

---

## 🚫 O QUE NUNCA FAZER

### ❌ Push sem Validação
```bash
# NUNCA faça isso (a menos que seja absolutamente necessário):
git push --no-verify
git commit --no-verify
```

**Por quê?** Você vai quebrar o deploy e perder tempo corrigindo depois.

### ❌ Commit de Secrets
- Nunca commite arquivos `.env` (exceto `.env.example`)
- Nunca commite API keys reais
- O hook pre-commit bloqueia, mas não confie apenas nele

### ❌ Ignorar Erros de TypeScript
```bash
# NUNCA faça isso:
// @ts-ignore
// @ts-nocheck
```

**Por quê?** Erros de tipo indicam bugs reais. Corrija a causa raiz.

---

## ✅ Fluxo de Trabalho Ideal

### 1. Criar Feature/Fix
```bash
# Criar branch
git checkout -b feature/minha-feature

# Desenvolver com validação contínua
npm run typecheck  # Rodar frequentemente enquanto desenvolve
```

### 2. Commit
```bash
# Adicionar mudanças
git add .

# Commit (pre-commit hook valida automaticamente)
git commit -m "feat: adiciona minha feature"

# Se falhar, corrigir e tentar novamente
npm run typecheck  # Ver erros
# ... corrigir ...
git add .
git commit -m "feat: adiciona minha feature"
```

### 3. Push
```bash
# Push (pre-push hook valida automaticamente)
git push origin feature/minha-feature

# Se falhar, corrigir e tentar novamente
npm run validate  # Ver todos os erros
# ... corrigir ...
git push origin feature/minha-feature
```

### 4. Deploy

**STAGING (develop):**
```bash
git checkout develop
git merge feature/minha-feature
git push origin develop
# ✅ Auto-deploy para http://31.97.255.107:3001
```

**PRODUCTION (main):**
```bash
# Criar PR: develop → main
# Aguardar review
# Merge via GitHub
# ✅ Auto-deploy para https://www.hallyuhub.com.br
```

---

## 🔧 Setup em Novo Ambiente

Se você clonar o repositório em uma nova máquina:

```bash
# 1. Instalar dependências
npm install

# 2. Configurar hooks (já devem estar configurados)
ls -la .git/hooks/pre-commit .git/hooks/pre-push

# 3. Testar hooks
git commit --allow-empty -m "test" # Deve rodar pre-commit
```

---

## 🆘 Troubleshooting

### Hook não está executando
```bash
# Verificar se está executável
ls -la .git/hooks/pre-commit
ls -la .git/hooks/pre-push

# Tornar executável se necessário
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push
```

### Build muito lento no pre-push
```bash
# O hook já usa SKIP_BUILD_STATIC_GENERATION=1
# Se ainda estiver lento, pode ignorar APENAS em emergências:
git push --no-verify

# Mas corrija os erros depois!
```

### Erros de TypeScript confusos
```bash
# Limpar e regenerar
rm -rf .next
rm -rf node_modules/.cache
npm run typecheck

# Se persistir, regenerar Prisma client
npx prisma generate
npm run typecheck
```

---

## 📊 Métricas de Qualidade

O objetivo é **ZERO falhas de deploy** causadas por:
- ❌ Erros de TypeScript
- ❌ Erros de lint
- ❌ Build failures

Se um deploy falhar por um desses motivos, **os hooks falharam** e precisam ser melhorados.

---

## 🎓 Princípios

1. **Fail Fast**: Detectar erros no commit, não no deploy
2. **Automação**: Hooks garantem que ninguém esqueça de validar
3. **Velocidade**: Pre-commit rápido, pre-push completo
4. **Clareza**: Mensagens de erro explicam como corrigir

---

## 📞 Em Caso de Dúvidas

Se você não tiver certeza se algo vai funcionar:

```bash
# Teste localmente primeiro
npm run validate

# Se passar, pode fazer push com confiança
```

**Regra de Ouro:** Se `npm run validate` passar localmente, o deploy **deve** passar.
