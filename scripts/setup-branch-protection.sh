#!/bin/bash
# ============================================================
# Setup Branch Protection - HallyuHub
# ============================================================
# Configura branch protection rule para main branch
# Adiciona Parity Check como status check obrigatório
# ============================================================

set -e

echo ""
echo "🔒 CONFIGURANDO BRANCH PROTECTION"
echo "=================================================="
echo ""

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ ERRO: gh CLI não instalado!"
    echo ""
    echo "Instale com: brew install gh"
    echo "Ou visite: https://cli.github.com/"
    exit 1
fi

# Verificar se está autenticado
if ! gh auth status &> /dev/null; then
    echo "❌ ERRO: Não autenticado no GitHub!"
    echo ""
    echo "Execute: gh auth login"
    exit 1
fi

echo "✅ gh CLI autenticado"
echo ""

# Obter informações do repositório
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repositório: $REPO"
echo ""

# Verificar se PR #43 foi mergeado
echo "🔍 Verificando se PR #43 foi mergeado..."
PR_STATE=$(gh pr view 43 --json state,merged -q '.state')
PR_MERGED=$(gh pr view 43 --json merged -q '.merged')

if [ "$PR_MERGED" != "true" ]; then
    echo "⚠️  AVISO: PR #43 ainda não foi mergeado!"
    echo ""
    echo "Você pode:"
    echo "  1. Aprovar e mergear o PR manualmente: https://github.com/$REPO/pull/43"
    echo "  2. Ou executar: gh pr merge 43 --squash"
    echo ""
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelado pelo usuário."
        exit 1
    fi
else
    echo "✅ PR #43 está mergeado"
fi

echo ""
echo "🔧 Configurando branch protection para 'main'..."
echo ""

# Aplicar branch protection rule
# Documentação: https://docs.github.com/en/rest/branches/branch-protection
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$REPO/branches/main/protection" \
  -f required_status_checks[strict]=true \
  -f "required_status_checks[contexts][]=Verificar Paridade Staging/Production" \
  -f "required_status_checks[contexts][]=Deploy Staging" \
  -f "required_status_checks[contexts][]=Deploy Production" \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f required_pull_request_reviews[require_code_owner_reviews]=false \
  -f required_pull_request_reviews[required_approving_review_count]=1 \
  -f enforce_admins=false \
  -f required_linear_history=false \
  -f allow_force_pushes=false \
  -f allow_deletions=false \
  -f required_conversation_resolution=true

echo ""
echo "=================================================="
echo "✅ BRANCH PROTECTION CONFIGURADA COM SUCESSO!"
echo "=================================================="
echo ""
echo "Regras aplicadas na branch 'main':"
echo ""
echo "  ✅ Require status checks antes de mergear:"
echo "     • Verificar Paridade Staging/Production 🔒"
echo "     • Deploy Staging"
echo "     • Deploy Production"
echo ""
echo "  ✅ Require 1 aprovação de PR"
echo "  ✅ Require conversas resolvidas"
echo "  ✅ Bloquear force pushes"
echo "  ✅ Bloquear deleções"
echo ""
echo "=================================================="
echo "🎯 RESULTADO"
echo "=================================================="
echo ""
echo "Agora NENHUM PR pode ser mergeado para main sem:"
echo ""
echo "  1. 🔍 Parity Check passar (staging = production)"
echo "  2. ✅ Deploy staging passar"
echo "  3. ✅ Deploy production passar"
echo "  4. 👍 Pelo menos 1 aprovação"
echo "  5. 💬 Todas as conversas resolvidas"
echo ""
echo "🛡️ Paridade staging/production está TRAVADA!"
echo ""
