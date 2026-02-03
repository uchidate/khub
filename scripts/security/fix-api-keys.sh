#!/bin/bash
# fix-api-keys.sh
# Remove API keys do Git e configura proteção

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CORREÇÃO DE SEGURANÇA - API KEYS                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Backup do .env atual
echo -e "${BLUE}1. Fazendo backup do .env atual...${NC}"
if [ -f "v1/.env" ]; then
    cp v1/.env v1/.env.backup
    echo -e "${GREEN}✓${NC} Backup criado: v1/.env.backup"
else
    echo -e "${YELLOW}⚠${NC} Arquivo v1/.env não encontrado"
fi
echo ""

# 2. Verificar se .env já está no .gitignore
echo -e "${BLUE}2. Atualizando .gitignore...${NC}"
if grep -q "^v1/.env$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓${NC} v1/.env já está no .gitignore"
else
    echo "v1/.env" >> .gitignore
    echo -e "${GREEN}✓${NC} Adicionado v1/.env ao .gitignore"
fi

# Adicionar outros padrões
cat >> .gitignore << 'EOF'

# Environment files (Security)
*.env.local
*.env.*.local
.env.backup

# API Keys e Secrets
*-credentials.json
*-secret.json
*.pem
*.key
*.p12
EOF

echo -e "${GREEN}✓${NC} .gitignore atualizado com padrões de segurança"
echo ""

# 3. Remover .env do stage se estiver
echo -e "${BLUE}3. Removendo v1/.env do stage (se existir)...${NC}"
if git ls-files --error-unmatch v1/.env > /dev/null 2>&1; then
    git rm --cached v1/.env
    echo -e "${GREEN}✓${NC} v1/.env removido do índice do Git"
else
    echo -e "${YELLOW}⚠${NC} v1/.env não estava no Git (OK)"
fi
echo ""

# 4. Verificar .env.example
echo -e "${BLUE}4. Verificando .env.example...${NC}"
if [ -f "v1/.env.example" ]; then
    # Verificar se há valores reais no .env.example
    if grep -E '(API_KEY|SECRET|PASSWORD|TOKEN)=.{10,}' v1/.env.example > /dev/null; then
        echo -e "${RED}✗${NC} ATENÇÃO: .env.example contém valores que parecem reais!"
        echo -e "${YELLOW}→${NC} Limpe os valores em v1/.env.example"
    else
        echo -e "${GREEN}✓${NC} .env.example está limpo"
    fi
else
    echo -e "${YELLOW}⚠${NC} v1/.env.example não encontrado"
fi
echo ""

# 5. Criar arquivo de template seguro
echo -e "${BLUE}5. Criando template de .env seguro...${NC}"
cat > v1/.env.template << 'EOF'
# DATABASE
DATABASE_URL="file:./dev.db"

# SITE
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# AI PROVIDERS
OLLAMA_BASE_URL="http://localhost:11434"
GEMINI_API_KEY=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# EXTERNAL APIS
TMDB_API_KEY=""
UNSPLASH_ACCESS_KEY=""
GOOGLE_CUSTOM_SEARCH_KEY=""
GOOGLE_CX=""

# GOOGLE DRIVE (OAuth)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# TELEMETRY
NEXT_TELEMETRY_DISABLED=1
EOF
echo -e "${GREEN}✓${NC} v1/.env.template criado"
echo ""

# 6. Instruções para regenerar API keys
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}⚠ AÇÃO NECESSÁRIA - REGENERAR API KEYS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "A chave GEMINI_API_KEY foi exposta no Git e precisa ser regenerada:"
echo ""
echo "1. Acesse: https://aistudio.google.com/app/apikey"
echo "2. Revogue a chave antiga: AIzaSyCeAhim6T2XZQfXy2F1c6Y7y8OVOoh5-_g"
echo "3. Gere uma nova chave"
echo "4. Adicione a nova chave em:"
echo "   - Localmente: v1/.env (criar do template)"
echo "   - Staging: GitHub Secrets (GEMINI_API_KEY)"
echo "   - Production: GitHub Secrets (GEMINI_API_KEY)"
echo ""
echo -e "${BLUE}GitHub Secrets:${NC}"
echo "   https://github.com/uchidate/khub/settings/secrets/actions"
echo ""

# 7. Verificar histórico do Git
echo -e "${BLUE}7. Verificando histórico do Git...${NC}"
if git log --all --full-history -- "v1/.env" | head -1 > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} v1/.env encontrado no histórico do Git"
    echo ""
    echo -e "${YELLOW}⚠ CRÍTICO:${NC} O arquivo .env está no histórico do Git!"
    echo ""
    echo "Opções para limpar o histórico:"
    echo ""
    echo "A) Usar BFG Repo-Cleaner (recomendado):"
    echo "   brew install bfg"
    echo "   bfg --delete-files .env"
    echo "   git reflog expire --expire=now --all"
    echo "   git gc --prune=now --aggressive"
    echo ""
    echo "B) Usar git filter-branch:"
    echo "   git filter-branch --force --index-filter \\"
    echo "     'git rm --cached --ignore-unmatch v1/.env' \\"
    echo "     --prune-empty --tag-name-filter cat -- --all"
    echo ""
    echo -e "${RED}⚠ AVISO:${NC} Isso reescreve o histórico do Git!"
    echo "   Coordene com a equipe antes de executar."
    echo ""
else
    echo -e "${GREEN}✓${NC} v1/.env não encontrado no histórico (ou já foi removido)"
fi
echo ""

# 8. Criar pre-commit hook
echo -e "${BLUE}8. Criando pre-commit hook...${NC}"
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/bash
# Pre-commit hook para detectar secrets

echo "🔍 Verificando secrets antes do commit..."

# Padrões perigosos
PATTERNS=(
  'API_KEY.*=.*[a-zA-Z0-9]{20,}'
  'SECRET.*=.*[a-zA-Z0-9]{20,}'
  'PASSWORD.*=.*[a-zA-Z0-9]{8,}'
  'TOKEN.*=.*[a-zA-Z0-9]{20,}'
  'PRIVATE_KEY'
  'AIza[0-9A-Za-z\\-_]{35}'  # Google API Key
  'sk-[a-zA-Z0-9]{48}'       # OpenAI API Key
  'sk-ant-[a-zA-Z0-9-]{95}'  # Anthropic API Key
)

FOUND=0
for pattern in "${PATTERNS[@]}"; do
  if git diff --cached | grep -E "$pattern" > /dev/null; then
    echo "❌ Secret detectado: $pattern"
    FOUND=1
  fi
done

# Verificar arquivos .env
if git diff --cached --name-only | grep -E '\.env$|\.env\..*' | grep -v '\.env\.example$' > /dev/null; then
  echo "❌ Tentativa de commitar arquivo .env"
  FOUND=1
fi

if [ $FOUND -eq 1 ]; then
  echo ""
  echo "❌ COMMIT BLOQUEADO: Secrets ou .env detectados!"
  echo ""
  echo "Para ignorar (NÃO RECOMENDADO): git commit --no-verify"
  exit 1
fi

echo "✅ Nenhum secret detectado"
HOOK
chmod +x .git/hooks/pre-commit
echo -e "${GREEN}✓${NC} Pre-commit hook instalado"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ CORREÇÕES DE SEGURANÇA APLICADAS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Próximos passos:"
echo "   1. Regenerar API keys (especialmente Gemini)"
echo "   2. Criar v1/.env local com novas keys"
echo "   3. Adicionar keys ao GitHub Secrets"
echo "   4. Commit das mudanças: git add .gitignore && git commit"
echo ""
