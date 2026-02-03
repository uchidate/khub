#!/bin/bash
# pre-deploy-validation.sh
# Validações robustas antes de fazer deploy

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         VALIDAÇÃO PRÉ-DEPLOY - HALLYUHUB                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Função para reportar erro
error() {
    echo -e "${RED}✗ ERRO:${NC} $1"
    ERRORS=$((ERRORS + 1))
}

# Função para reportar warning
warning() {
    echo -e "${YELLOW}⚠ AVISO:${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# Função para reportar sucesso
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Função para reportar info
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "━━━ 1. VERIFICAÇÕES DE GIT ━━━"
echo ""

# Verifica se está em um repositório git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Não está em um repositório git"
else
    success "Repositório git detectado"
fi

# Verifica branch atual
CURRENT_BRANCH=$(git branch --show-current)
info "Branch atual: ${CURRENT_BRANCH}"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "develop" ]; then
    warning "Branch '${CURRENT_BRANCH}' não é main nem develop"
    echo "  → Certifique-se de fazer merge para main (prod) ou develop (staging)"
fi

# Verifica se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    error "Existem mudanças não commitadas"
    echo "  → Execute: git status"
    echo "  → Faça commit ou stash das mudanças antes de fazer deploy"
else
    success "Nenhuma mudança não commitada"
fi

# Verifica se está sincronizado com remote
git fetch origin --quiet 2>/dev/null || true

if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "develop" ]; then
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

    if [ -z "$REMOTE" ]; then
        warning "Branch local não está tracking um branch remoto"
    elif [ "$LOCAL" != "$REMOTE" ]; then
        error "Branch local está dessincronizada com remote"
        echo "  → Execute: git pull origin ${CURRENT_BRANCH}"
    else
        success "Branch sincronizada com remote"
    fi
fi

echo ""
echo "━━━ 2. VERIFICAÇÕES DE DEPENDÊNCIAS ━━━"
echo ""

# Verifica se node_modules existe
if [ ! -d "v1/node_modules" ]; then
    error "node_modules não encontrado"
    echo "  → Execute: cd v1 && npm install"
else
    success "node_modules encontrado"
fi

# Verifica se package-lock.json existe
if [ ! -f "v1/package-lock.json" ]; then
    warning "package-lock.json não encontrado"
    echo "  → Recomendado para builds reproduzíveis"
else
    success "package-lock.json encontrado"
fi

# Verifica se há dependências desatualizadas críticas (vulnerabilidades)
cd v1
if command -v npm &> /dev/null; then
    info "Verificando vulnerabilidades..."
    if npm audit --production --audit-level=high > /dev/null 2>&1; then
        success "Nenhuma vulnerabilidade crítica encontrada"
    else
        warning "Vulnerabilidades encontradas nas dependências"
        echo "  → Execute: cd v1 && npm audit"
        echo "  → Considere executar: npm audit fix"
    fi
fi
cd ..

echo ""
echo "━━━ 3. VERIFICAÇÕES DE BUILD ━━━"
echo ""

# Verifica se .env existe
if [ ! -f "v1/.env" ]; then
    warning "Arquivo .env não encontrado"
    echo "  → Copie de .env.example: cp v1/.env.example v1/.env"
else
    success "Arquivo .env encontrado"

    # Verifica variáveis críticas
    if grep -q "DATABASE_URL=" v1/.env; then
        success "DATABASE_URL configurada"
    else
        error "DATABASE_URL não configurada no .env"
    fi
fi

# Tenta fazer build
info "Tentando build do projeto..."
cd v1

if npm run build > /tmp/build.log 2>&1; then
    success "Build executado com sucesso"
else
    error "Build falhou"
    echo "  → Veja os logs: tail /tmp/build.log"
    echo "  → Execute: cd v1 && npm run build"
fi

cd ..

echo ""
echo "━━━ 4. VERIFICAÇÕES DE VERSÃO ━━━"
echo ""

# Verifica se package.json tem versão
VERSION=$(cat v1/package.json | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/')
if [ -z "$VERSION" ]; then
    warning "Versão não definida no package.json"
else
    success "Versão atual: ${VERSION}"
fi

# Verifica se há tags git para versionamento
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "nenhuma")
info "Última tag git: ${LAST_TAG}"

if [ "$LAST_TAG" = "nenhuma" ]; then
    warning "Nenhuma tag git encontrada"
    echo "  → Considere criar tags para releases: git tag -a v1.0.0 -m 'Release 1.0.0'"
fi

echo ""
echo "━━━ 5. VERIFICAÇÕES DE DOCKER ━━━"
echo ""

# Verifica se Dockerfile existe
if [ ! -f "v1/Dockerfile" ]; then
    error "Dockerfile não encontrado"
else
    success "Dockerfile encontrado"
fi

# Verifica se docker-compose existe
if [ ! -f "v1/docker-compose.yml" ]; then
    warning "docker-compose.yml não encontrado"
else
    success "docker-compose.yml encontrado"
fi

# Verifica se Docker está instalado e rodando
if command -v docker &> /dev/null; then
    if docker ps > /dev/null 2>&1; then
        success "Docker está rodando"
    else
        warning "Docker instalado mas não está rodando"
        echo "  → Inicie o Docker Desktop ou docker daemon"
    fi
else
    warning "Docker não está instalado"
fi

echo ""
echo "━━━ 6. VERIFICAÇÕES DE AMBIENTE ━━━"
echo ""

# Verifica se há arquivos .env de exemplo para cada ambiente
if [ -f "v1/.env.example" ]; then
    success ".env.example encontrado"
else
    warning ".env.example não encontrado"
fi

if [ -f "v1/.env.staging.example" ]; then
    success ".env.staging.example encontrado"
else
    warning ".env.staging.example não encontrado"
fi

if [ -f "v1/.env.production.example" ]; then
    success ".env.production.example encontrado"
else
    warning ".env.production.example não encontrado"
fi

echo ""
echo "━━━ 7. VERIFICAÇÕES DE TESTES ━━━"
echo ""

# Verifica se há scripts de teste
if grep -q '"test":' v1/package.json; then
    info "Script de teste encontrado no package.json"

    # Tenta executar testes (se existir)
    cd v1
    if npm run test > /dev/null 2>&1; then
        success "Testes passaram"
    else
        warning "Testes falharam ou não configurados"
        echo "  → Execute: cd v1 && npm test"
    fi
    cd ..
else
    warning "Nenhum script de teste configurado"
    echo "  → Considere adicionar testes para maior robustez"
fi

echo ""
echo "━━━ 8. VERIFICAÇÕES DE SEGURANÇA ━━━"
echo ""

# Verifica se .env está no .gitignore
if grep -q "\.env" .gitignore 2>/dev/null; then
    success ".env está no .gitignore"
else
    error ".env NÃO está no .gitignore"
    echo "  → CRÍTICO: Adicione .env ao .gitignore para evitar vazar credenciais"
fi

# Verifica se node_modules está no .gitignore
if grep -q "node_modules" .gitignore 2>/dev/null; then
    success "node_modules está no .gitignore"
else
    warning "node_modules não está no .gitignore"
fi

# Verifica se há arquivos sensíveis commitados
SENSITIVE_FILES=(".env" "*.pem" "*.key" "*.p12" "secrets.json")
for pattern in "${SENSITIVE_FILES[@]}"; do
    if git ls-files | grep -q "$pattern" 2>/dev/null; then
        error "Arquivo sensível detectado no git: $pattern"
        echo "  → CRÍTICO: Remova do git: git rm --cached $pattern"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESUMO DA VALIDAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ TUDO OK!${NC} Pronto para deploy."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} avisos encontrados${NC}"
    echo "  Revise os avisos acima. Deploy pode prosseguir com cautela."
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} erros encontrados${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ ${WARNINGS} avisos encontrados${NC}"
    fi
    echo ""
    echo "  CORRIJA OS ERROS antes de fazer deploy!"
    exit 1
fi
