#!/bin/bash
# ============================================================
# Script de Verificação de Produção - HallyuHub
# ============================================================
# Verifica se TODAS as configurações estão corretas
# ============================================================

# set -e (Desativado para permitir coleta de todos os erros/avisos)

ERRORS=0
WARNINGS=0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  VERIFICAÇÃO DE PRODUÇÃO - HallyuHub"
echo "=========================================="
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
        return 0
    fi
}

echo "📦 CONTAINERS"
echo "----------------------------------------"
check "Container hallyuhub" "docker ps | grep -q 'hallyuhub$' && docker ps | grep 'hallyuhub$' | grep -q 'Up'"
check "Container postgres-production" "docker ps | grep -q 'hallyuhub-postgres-production' && docker ps | grep 'hallyuhub-postgres-production' | grep -q 'Up'"
check "Container ollama-production" "docker ps | grep -q 'hallyuhub-ollama-production' && docker ps | grep 'hallyuhub-ollama-production' | grep -q 'Up'"
echo ""

echo "🗄️  VOLUMES DOCKER"
echo "----------------------------------------"
check "Volume hallyuhub-data" "docker volume inspect hallyuhub-data"
check "Volume postgres-production-data" "docker volume inspect postgres-production-data"
check "Volume ollama-production-data" "docker volume inspect ollama-production-data"
echo ""

echo "🌐 REDE"
echo "----------------------------------------"
check "Network web" "docker network inspect web"
echo ""

echo "📝 ARQUIVOS DE CONFIGURAÇÃO"
echo "----------------------------------------"
check "Arquivo .env.production" "test -f /var/www/hallyuhub/.env.production"

# Função para verificar variável no .env
check_env() {
    local key=$1
    check "$key configurada" "grep -q \"^$key=\" /var/www/hallyuhub/.env.production"
}

check_env "DATABASE_URL"
check_env "NEXT_PUBLIC_SITE_URL"
check_env "GEMINI_API_KEY"
check_env "OLLAMA_BASE_URL"
check "Nginx config" "test -f /etc/nginx/sites-enabled/hallyuhub"
echo ""

echo "🔐 NGINX E SSL"
echo "----------------------------------------"
check "Nginx rodando" "systemctl is-active nginx"
check "Nginx config válida" "nginx -t"
check "Certificado SSL" "test -f /etc/letsencrypt/live/hallyuhub.com.br/fullchain.pem"
warn "Certificado válido" "certbot certificates 2>&1 | grep -q 'VALID'"
echo ""

echo "🗄️  BANCO DE DADOS"
echo "----------------------------------------"
check "PostgreSQL respondendo" "docker exec hallyuhub-postgres-production pg_isready -U hallyuhub"
check "Database hallyuhub_production existe" "docker exec hallyuhub-postgres-production psql -U hallyuhub -lqt | grep -qw hallyuhub_production"
check "Conexão da aplicação" "docker exec hallyuhub env | grep -q 'DATABASE_URL=postgresql://'"
echo ""

echo "🤖 OLLAMA"
echo "----------------------------------------"
warn "Ollama container saudável" "docker inspect hallyuhub-ollama-production | grep -q '\"Status\": \"healthy\"'"
warn "Modelo phi3 instalado" "docker exec hallyuhub-ollama-production ollama list | grep -q phi3"
echo ""

echo "🌍 SITE E APIs"
echo "----------------------------------------"
check "Site acessível (HTTP)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q '307\|200'"
check "Site acessível (HTTPS)" "curl -s -k -o /dev/null -w '%{http_code}' https://www.hallyuhub.com.br | grep -q '307\|200'"
check "Health endpoint (Global)" "curl -s https://www.hallyuhub.com.br/api/health | grep -q '\"ok\":true'"
check "AI Config: Gemini" "curl -s https://www.hallyuhub.com.br/api/health | grep -q '\"gemini\":{\"configured\":true}'"
check "AI Config: Ollama" "curl -s https://www.hallyuhub.com.br/api/health | grep -q '\"ollama\":{.*\"configured\":true}'"
echo ""

echo "🔒 SEGURANÇA"
echo "----------------------------------------"
warn "Traefik parado" "docker ps | grep -q traefik && echo 'Traefik ainda rodando!' && exit 1 || exit 0"
warn "Firewall ativo" "ufw status | grep -q active"
echo ""

echo "=========================================="
echo "  RESULTADO"
echo "=========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ TUDO OK!${NC}"
    echo ""
    echo "Sistema totalmente operacional"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ OK COM AVISOS${NC}"
    echo ""
    echo "Erros: $ERRORS"
    echo "Avisos: $WARNINGS"
    echo ""
    echo "Sistema operacional mas com algumas otimizações pendentes"
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
