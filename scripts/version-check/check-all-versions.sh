#!/bin/bash
# check-all-versions.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     VERIFICAÇÃO DE VERSÕES - HALLYUHUB                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ========== LOCAL ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 AMBIENTE LOCAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOCAL_VERSION=$(cat v1/package.json | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/')
LOCAL_BRANCH=$(git branch --show-current)
LOCAL_COMMIT=$(git log -1 --format="%h - %s" | head -c 60)
LOCAL_STATUS=$(git status --short | wc -l | tr -d ' ')

echo -e "   Versão package.json: ${GREEN}${LOCAL_VERSION}${NC}"
echo -e "   Branch atual:        ${YELLOW}${LOCAL_BRANCH}${NC}"
echo "   Último commit:       ${LOCAL_COMMIT}"
echo "   Arquivos modificados: ${LOCAL_STATUS}"
echo ""

# ========== STAGING ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 AMBIENTE STAGING (HOMOLOGAÇÃO)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STAGING_URL="http://31.97.255.107:3001"
STAGING_BRANCH="develop"
STAGING_COMMIT=$(git log ${STAGING_BRANCH} -1 --format="%h - %s" 2>/dev/null | head -c 60 || echo "Branch não encontrada")

echo "   URL:                 ${STAGING_URL}"
echo -e "   Branch esperada:     ${YELLOW}${STAGING_BRANCH}${NC}"
echo "   Último commit:       ${STAGING_COMMIT}"

# Tenta fazer health check
if command -v curl &> /dev/null; then
    STAGING_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" ${STAGING_URL}/api/health 2>/dev/null || echo "000")
    if [ "$STAGING_HEALTH" = "200" ]; then
        echo -e "   Status:              ${GREEN}✓ Online (HTTP $STAGING_HEALTH)${NC}"
    else
        echo -e "   Status:              ${RED}✗ Offline ou erro (HTTP $STAGING_HEALTH)${NC}"
    fi
else
    echo "   Status:              ⚠ curl não instalado - não foi possível verificar"
fi
echo ""

# ========== PRODUCTION ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 AMBIENTE PRODUCTION (PRODUÇÃO)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROD_URL="http://31.97.255.107:3000"
PROD_BRANCH="main"
PROD_COMMIT=$(git log ${PROD_BRANCH} -1 --format="%h - %s" 2>/dev/null | head -c 60 || echo "Branch não encontrada")

echo "   URL:                 ${PROD_URL}"
echo -e "   Branch esperada:     ${YELLOW}${PROD_BRANCH}${NC}"
echo "   Último commit:       ${PROD_COMMIT}"

# Tenta fazer health check
if command -v curl &> /dev/null; then
    PROD_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" ${PROD_URL}/api/health 2>/dev/null || echo "000")
    if [ "$PROD_HEALTH" = "200" ]; then
        echo -e "   Status:              ${GREEN}✓ Online (HTTP $PROD_HEALTH)${NC}"
    else
        echo -e "   Status:              ${RED}✗ Offline ou erro (HTTP $PROD_HEALTH)${NC}"
    fi
else
    echo "   Status:              ⚠ curl não instalado - não foi possível verificar"
fi
echo ""

# ========== COMPARAÇÃO ==========
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 ANÁLISE DE CONSISTÊNCIA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verifica se local está sincronizado com main
if [ "$LOCAL_BRANCH" = "main" ]; then
    DIFF_MAIN=$(git rev-list --count main...HEAD 2>/dev/null || echo "0")
    if [ "$DIFF_MAIN" -eq 0 ]; then
        echo -e "   ${GREEN}✓${NC} Local está sincronizado com main (produção)"
    else
        echo -e "   ${YELLOW}⚠${NC} Local tem $DIFF_MAIN commits diferentes de main"
    fi
fi

# Verifica se local está sincronizado com develop
if [ "$LOCAL_BRANCH" = "develop" ]; then
    DIFF_DEVELOP=$(git rev-list --count develop...HEAD 2>/dev/null || echo "0")
    if [ "$DIFF_DEVELOP" -eq 0 ]; then
        echo -e "   ${GREEN}✓${NC} Local está sincronizado com develop (staging)"
    else
        echo -e "   ${YELLOW}⚠${NC} Local tem $DIFF_DEVELOP commits diferentes de develop"
    fi
fi

# Verifica se há mudanças não commitadas
if [ "$LOCAL_STATUS" -gt 0 ]; then
    echo -e "   ${YELLOW}⚠${NC} Existem $LOCAL_STATUS arquivo(s) modificado(s) localmente"
else
    echo -e "   ${GREEN}✓${NC} Não há mudanças locais não commitadas"
fi

# Verifica diferenças entre main e develop
DIFF_BRANCHES=$(git rev-list --count main...develop 2>/dev/null || echo "0")
if [ "$DIFF_BRANCHES" -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} main e develop estão sincronizadas"
else
    echo -e "   ${YELLOW}⚠${NC} Existem $DIFF_BRANCHES commits de diferença entre main e develop"
    echo "      Execute: git log main...develop --oneline"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
