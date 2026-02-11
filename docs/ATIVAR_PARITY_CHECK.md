# 🚀 Como Ativar o Parity Check (2 passos)

## TL;DR

```bash
# 1. Aprovar e mergear PR #43
gh pr merge 43 --squash

# 2. Executar script de configuração
./scripts/setup-branch-protection.sh
```

**Pronto!** 🎉 Paridade staging/production está travada via CI.

---

## Passo a Passo Detalhado

### 1️⃣ Aprovar e Mergear PR #43

**Opção A: Via GitHub Web**
1. Abrir: https://github.com/uchidate/khub/pull/43
2. Clicar em **Review changes** → **Approve**
3. Clicar em **Merge pull request** → **Confirm**

**Opção B: Via CLI**
```bash
gh pr review 43 --approve
gh pr merge 43 --squash
```

### 2️⃣ Executar Script de Configuração

```bash
cd /Users/fabiouchidate/Antigravity/khub
./scripts/setup-branch-protection.sh
```

**O script faz:**
- ✅ Verifica se gh CLI está instalado e autenticado
- ✅ Confirma se PR #43 foi mergeado
- ✅ Configura branch protection na branch `main`
- ✅ Adiciona status checks obrigatórios:
  - **Verificar Paridade Staging/Production** 🔒
  - Deploy Staging
  - Deploy Production
- ✅ Exige 1 aprovação de PR
- ✅ Bloqueia force pushes e deleções

---

## 🎯 O Que Acontece Depois

### ✅ PRs Futuros

Quando alguém criar um PR que modifica `deploy.yml`, `docker-compose.*.yml`, ou `.env.*.example`:

1. **Parity Check roda automaticamente**
2. **Compara staging vs production**
3. **Permite apenas diferenças whitelist**
4. **Bloqueia merge se houver divergências**

### ❌ Exemplo: PR Bloqueado

```
❌ FALHA: Encontradas diferenças NÃO autorizadas!

DIFERENÇAS DETECTADAS:
+  healthcheck:
+    test: ["CMD", "curl", "-f", "http://localhost:3000"]

REGRA: Staging e Production DEVEM ser espelhos!
```

PR não pode ser mergeado até corrigir.

### ✅ Exemplo: PR Aprovado

```
✅ SUCESSO: Staging e Production são espelhos perfeitos!

Diferenças permitidas (particularidades de ambiente):
  - staging|production
  - .env.staging|.env.production
  - 31.97.255.107:3001|www.hallyuhub.com.br
  - restart: "no"|restart: always
```

PR pode ser mergeado normalmente.

---

## 🔧 Gerenciar Whitelist de Diferenças

Se precisar adicionar uma nova particularidade legítima:

1. Editar [`.github/workflows/parity-check.yml`](../.github/workflows/parity-check.yml)
2. Adicionar na lista `ALLOWED_DIFFS`:

```bash
ALLOWED_DIFFS=(
  "staging|production"
  # ... outras diferenças ...
  "nova-particularidade-staging|nova-particularidade-production"
)
```

3. Commitar e fazer PR
4. Parity check validará a nova regra

---

## 🛠️ Troubleshooting

### Script falha: "gh CLI não instalado"

```bash
brew install gh
gh auth login
```

### Status check não aparece no PR

**Causa:** Workflow ainda não rodou nenhuma vez.

**Solução:**
1. Fazer um PR de teste modificando `deploy.yml`
2. Workflow rodará automaticamente
3. Status check aparecerá nas opções

### Como desativar temporariamente

**Via GitHub Web:**
Settings → Branches → Editar `main` → Desmarcar status checks

**Via CLI:**
```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/uchidate/khub/branches/main/protection" \
  -f required_status_checks[strict]=false \
  -f required_status_checks[contexts][]=
```

---

## 📚 Documentação Completa

- **Como funciona:** [`docs/PARITY_ENFORCEMENT.md`](PARITY_ENFORCEMENT.md)
- **Workflow:** [`.github/workflows/parity-check.yml`](../.github/workflows/parity-check.yml)
- **Memória:** Regra crítica em [`MEMORY.md`](../memory/MEMORY.md)

---

## 🎉 Benefícios

| Antes | Depois |
|-------|--------|
| ❌ Divergências manuais | ✅ CI bloqueia automaticamente |
| ❌ Erros descobertos tarde | ✅ Erros detectados no PR |
| ❌ Depende de revisão humana | ✅ Validação automatizada |
| ❌ Sem garantias | ✅ **TRAVADO via CI** 🔒 |
