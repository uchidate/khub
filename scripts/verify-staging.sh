#!/bin/bash
# ============================================================
# Script de Verificação de Staging - HallyuHub
# ============================================================
# Verifica se TODAS as configurações estão corretas
# ============================================================

set -e

ERRORS=0
WARNINGS=0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "==========================================="
echo "  VERIFICAÇÃO DE STAGING - HallyuHub"
echo "==========================================="
echo ""

# Função para verificar
check() {
    local name="$1"
    local command="$2"

    echo -n "Verificando $name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((ERRORS++))
        return 1
    fi
}

# Função para avisos
warn() {
    local name="$1"
    local command="$2"

    echo -n "Verificando $name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠${NC}"
        ((WARNINGS++))
        return 1
    fi
}

echo "📦 CONTAINERS"
echo "-------------------------------------------"
check "Container hallyuhub-staging" "docker ps | grep -q 'hallyuhub-staging$' && docker ps | grep 'hallyuhub-staging$' | grep -q 'Up'"
check "Container postgres-staging" "docker ps | grep -q 'hallyuhub-postgres-staging' && docker ps | grep 'hallyuhub-postgres-staging' | grep -q 'Up'"
check "Container ollama-staging" "docker ps | grep -q 'hallyuhub-ollama-staging' && docker ps | grep 'hallyuhub-ollama-staging' | grep -q 'Up'"
echo ""

echo "🗄️  VOLUMES DOCKER"
echo "-------------------------------------------"
warn "Volume postgres-staging-data" "docker volume inspect postgres-staging-data"
warn "Volume ollama-staging-data" "docker volume inspect ollama-staging-data"
echo ""

echo "🌐 REDE"
echo "-------------------------------------------"
check "Network web" "docker network inspect web"
echo ""

echo "📝 ARQUIVOS DE CONFIGURAÇÃO"
echo "-------------------------------------------"
check "Arquivo .env.staging" "test -f /var/www/hallyuhub/.env.staging"
check "DATABASE_URL configurada" "grep -q 'postgresql://' /var/www/hallyuhub/.env.staging"
check "POSTGRES_PASSWORD configurada" "grep -q 'POSTGRES_PASSWORD=' /var/www/hallyuhub/.env.staging"
echo ""

echo "🗄️  BANCO DE DADOS"
echo "-------------------------------------------"
check "PostgreSQL respondendo" "docker exec hallyuhub-postgres-staging pg_isready -U hallyuhub"
check "Database hallyuhub_staging existe" "docker exec hallyuhub-postgres-staging psql -U hallyuhub -lqt | grep -qw hallyuhub_staging"
check "Conexão da aplicação" "docker exec hallyuhub-staging env | grep -q 'DATABASE_URL=postgresql://'"
echo ""

echo "🤖 OLLAMA"
echo "-------------------------------------------"
check "Ollama container saudável" "docker inspect hallyuhub-ollama-staging | grep -q '\"Status\": \"healthy\"'"
warn "Modelo phi3 instalado" "docker exec hallyuhub-ollama-staging ollama list | grep -q phi3"
echo ""

echo "🌍 SITE E APIs"
echo "-------------------------------------------"
check "Site acessível (HTTP)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001 | grep -q '307\\|200'"
check "Health endpoint" "curl -s http://localhost:3001/api/health | grep -q '\"ok\":true'"
echo ""

echo "==========================================="
echo "  RESULTADO"
echo "==========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ TUDO OK!${NC}"
    echo ""
    echo "Staging totalmente operacional"
    echo "URL: http://localhost:3001"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ OK COM AVISOS${NC}"
    echo ""
    echo "Erros: $ERRORS"
    echo "Avisos: $WARNINGS"
    echo ""
    echo "Staging operacional mas com algumas otimizações pendentes"
    echo "URL: http://localhost:3001"
    exit 0
else
    echo -e "${RED}✗ PROBLEMAS ENCONTRADOS${NC}"
    echo ""
    echo "Erros: $ERRORS"
    echo "Avisos: $WARNINGS"
    echo ""
    echo "Corrija os erros antes de prosseguir"
    exit 1
fi
