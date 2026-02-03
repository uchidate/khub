#!/bin/bash
# quick-check.sh
# Verificação rápida antes de começar o dia de trabalho

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          QUICK CHECK - HALLYUHUB                          ║"
echo "║        Verificação Rápida de Todos os Sistemas           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Git Status
echo -e "${BLUE}━━━ GIT STATUS ━━━${NC}"
BRANCH=$(git branch --show-current)
echo "Branch atual: ${BRANCH}"

if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ Há mudanças não commitadas${NC}"
    git status --short | head -5
else
    echo -e "${GREEN}✓ Working tree limpo${NC}"
fi
echo ""

# 2. Versão Local
echo -e "${BLUE}━━━ VERSÃO LOCAL ━━━${NC}"
VERSION=$(cat v1/package.json | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/')
echo "Versão: ${VERSION}"
echo "Commit: $(git log -1 --oneline | head -c 60)"
echo ""

# 3. Ambientes Online
echo -e "${BLUE}━━━ AMBIENTES ━━━${NC}"

# Staging
STAGING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://31.97.255.107:3001/api/health 2>/dev/null || echo "000")
echo -n "Staging:    "
if [ "$STAGING_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Online${NC}"
else
    echo -e "${RED}✗ Offline (HTTP ${STAGING_STATUS})${NC}"
fi

# Production
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://31.97.255.107:3000/api/health 2>/dev/null || echo "000")
echo -n "Production: "
if [ "$PROD_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Online${NC}"
else
    echo -e "${RED}✗ Offline (HTTP ${PROD_STATUS})${NC}"
fi

echo ""

# 4. Sincronização
echo -e "${BLUE}━━━ SINCRONIZAÇÃO ━━━${NC}"

# Atualiza refs
git fetch origin --quiet 2>/dev/null || true

# Verifica main
LOCAL_MAIN=$(git rev-parse main 2>/dev/null)
REMOTE_MAIN=$(git rev-parse origin/main 2>/dev/null)

if [ "$LOCAL_MAIN" = "$REMOTE_MAIN" ]; then
    echo -e "${GREEN}✓${NC} main sincronizada"
else
    echo -e "${YELLOW}⚠${NC} main dessincronizada (execute: git pull origin main)"
fi

# Verifica develop
LOCAL_DEV=$(git rev-parse develop 2>/dev/null)
REMOTE_DEV=$(git rev-parse origin/develop 2>/dev/null)

if [ "$LOCAL_DEV" = "$REMOTE_DEV" ]; then
    echo -e "${GREEN}✓${NC} develop sincronizada"
else
    echo -e "${YELLOW}⚠${NC} develop dessincronizada (execute: git pull origin develop)"
fi

echo ""

# 5. Últimos deploys
echo -e "${BLUE}━━━ ÚLTIMAS ATIVIDADES ━━━${NC}"
echo "Últimos 3 commits:"
git log -3 --oneline --decorate | sed 's/^/  /'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Status geral
if [ "$STAGING_STATUS" = "200" ] && [ "$PROD_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Todos os sistemas operacionais${NC}"
else
    echo -e "${YELLOW}⚠ Alguns sistemas necessitam atenção${NC}"
fi

echo ""
