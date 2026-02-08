#!/bin/bash

#
# Script de Deploy Automatizado
# Uso: ./scripts/deploy.sh [staging|production]
#

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
SERVER_HOST="31.97.255.107"
SERVER_USER="root"
REPO_PATH="/var/www/hallyuhub"

# Functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Deploy cancelado"
    fi
}

# Parse arguments
ENV=${1:-staging}

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
    error "Ambiente inválido. Use: staging ou production"
fi

# Banner
echo ""
echo "╔════════════════════════════════════════╗"
echo "║                                        ║"
echo "║   🚀 DEPLOY - HALLYUHUB               ║"
echo "║                                        ║"
echo "╚════════════════════════════════════════╝"
echo ""
info "Ambiente: $ENV"
info "Servidor: $SERVER_HOST"
echo ""

# Step 1: Check local changes
info "Verificando alterações locais..."

if [[ -n $(git status --porcelain) ]]; then
    warning "Você tem alterações não commitadas!"
    git status --short
    echo ""
    confirm "Deseja continuar mesmo assim?"
fi

success "Verificação local OK"

# Step 2: Confirm deploy
if [[ "$ENV" == "production" ]]; then
    warning "ATENÇÃO: Você está fazendo deploy em PRODUÇÃO!"
    warning "Certifique-se de que testou em staging primeiro."
    echo ""
    confirm "Tem certeza que deseja continuar?"
fi

# Step 3: Git pull and push
info "Sincronizando com repositório..."

git pull origin main || warning "Falha ao fazer pull (continuando...)"
git push origin main || error "Falha ao fazer push"

success "Código sincronizado"

# Step 4: SSH and deploy
info "Conectando ao servidor..."

ssh -t $SERVER_USER@$SERVER_HOST << ENDSSH
set -e

echo ""
echo "📦 Iniciando deploy em $ENV..."
echo ""

# Navigate to repo
cd $REPO_PATH

# Pull latest code
echo "⏬ Baixando código..."
git pull origin main

# Select docker-compose file
if [ "$ENV" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    SERVICE_NAME="hallyuhub"
else
    COMPOSE_FILE="docker-compose.staging.yml"
    SERVICE_NAME="hallyuhub"
fi

echo "📋 Usando: \$COMPOSE_FILE"

# Build
echo ""
echo "🔨 Buildando imagem..."
docker-compose -f \$COMPOSE_FILE build --no-cache \$SERVICE_NAME

# Run migrations
echo ""
echo "🗄️  Executando migrações..."
docker-compose -f \$COMPOSE_FILE exec -T \$SERVICE_NAME npx prisma migrate deploy || echo "⚠️  Migrações falharam ou não há migrações pendentes"

# Restart service
echo ""
echo "🔄 Reiniciando serviço..."
docker-compose -f \$COMPOSE_FILE up -d --no-deps \$SERVICE_NAME

# Wait for healthcheck
echo ""
echo "⏳ Aguardando healthcheck..."
sleep 10

# Check health
if [ "$ENV" = "production" ]; then
    HEALTH_URL="https://hallyuhub.com.br/api/health"
else
    HEALTH_URL="http://localhost:3001/api/health"
fi

if curl -f -s \$HEALTH_URL > /dev/null; then
    echo "✅ Healthcheck OK!"
else
    echo "❌ Healthcheck FALHOU!"
    exit 1
fi

# Show logs
echo ""
echo "📋 Últimas 20 linhas de log:"
docker-compose -f \$COMPOSE_FILE logs --tail=20 \$SERVICE_NAME

echo ""
echo "✅ Deploy completado com sucesso!"
echo ""
ENDSSH

# Check SSH exit code
if [ $? -eq 0 ]; then
    success "Deploy concluído com sucesso!"
    echo ""
    info "Próximos passos:"
    echo "  1. Verificar logs: ssh $SERVER_USER@$SERVER_HOST 'cd $REPO_PATH && docker-compose -f docker-compose.$ENV.yml logs -f'"
    echo "  2. Testar aplicação"
    if [[ "$ENV" == "staging" ]]; then
        echo "  3. Se tudo OK, fazer deploy em produção: ./scripts/deploy.sh production"
    fi
    echo ""
else
    error "Deploy falhou! Verifique os logs no servidor."
fi
