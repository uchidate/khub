#!/bin/bash
# bump-version.sh
# Script para atualizar versão do projeto automaticamente

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         ATUALIZAÇÃO DE VERSÃO - HALLYUHUB                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verifica se está em um repositório git limpo
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ Aviso:${NC} Existem mudanças não commitadas"
    echo "Faça commit antes de atualizar a versão."
    exit 1
fi

# Pega versão atual
CURRENT_VERSION=$(cat v1/package.json | grep '"version"' | sed 's/.*: "\(.*\)".*/\1/')
echo -e "Versão atual: ${BLUE}${CURRENT_VERSION}${NC}"
echo ""

# Parse da versão (assume formato semver: MAJOR.MINOR.PATCH)
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

echo "Selecione o tipo de atualização:"
echo "1) Patch   (${MAJOR}.${MINOR}.$((PATCH+1))) - Correções de bugs"
echo "2) Minor   (${MAJOR}.$((MINOR+1)).0) - Novas funcionalidades (compatível)"
echo "3) Major   ($((MAJOR+1)).0.0) - Mudanças incompatíveis"
echo "4) Custom  - Especificar versão manualmente"
echo ""
read -p "Opção [1-4]: " VERSION_OPTION

case $VERSION_OPTION in
    1)
        NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH+1))"
        TYPE="patch"
        ;;
    2)
        NEW_VERSION="${MAJOR}.$((MINOR+1)).0"
        TYPE="minor"
        ;;
    3)
        NEW_VERSION="$((MAJOR+1)).0.0"
        TYPE="major"
        ;;
    4)
        read -p "Digite a nova versão (formato: X.Y.Z): " CUSTOM_VERSION
        if [[ ! $CUSTOM_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}✗ Formato inválido. Use X.Y.Z${NC}"
            exit 1
        fi
        NEW_VERSION="$CUSTOM_VERSION"
        TYPE="custom"
        ;;
    *)
        echo "Opção inválida"
        exit 1
        ;;
esac

echo ""
echo -e "Nova versão: ${GREEN}${NEW_VERSION}${NC}"
echo ""

read -p "Confirma a atualização? [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "Atualizando versão..."

# Atualiza package.json
cd v1
npm version ${NEW_VERSION} --no-git-tag-version
cd ..

echo -e "${GREEN}✓${NC} package.json atualizado"

# Commit da mudança
git add v1/package.json v1/package-lock.json
git commit -m "chore: bump version to ${NEW_VERSION}"

echo -e "${GREEN}✓${NC} Commit criado"

# Cria tag git
TAG_NAME="v${NEW_VERSION}"
read -p "Criar tag git '${TAG_NAME}'? [Y/n]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    git tag -a "${TAG_NAME}" -m "Release ${NEW_VERSION}"
    echo -e "${GREEN}✓${NC} Tag '${TAG_NAME}' criada"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ VERSÃO ATUALIZADA COM SUCESSO${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Próximos passos:"
echo "  1. Revise o commit: git show"
echo "  2. Faça push: git push origin $(git branch --show-current)"
echo "  3. Faça push da tag: git push origin ${TAG_NAME}"
echo ""
echo "Isso vai triggar o CI/CD e fazer deploy automaticamente."
echo ""
