#!/bin/bash
# rollback.sh
# Script para fazer rollback em caso de problemas no deploy

set -e

# Configuração
SSH_USER="${SSH_USER:-seu-usuario}"
SSH_HOST="31.97.255.107"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ROLLBACK - HALLYUHUB                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Função para perguntar confirmação
confirm() {
    read -p "$1 [y/N]: " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Verifica o ambiente
echo "Selecione o ambiente para rollback:"
echo "1) Production (http://31.97.255.107:3000)"
echo "2) Staging (http://31.97.255.107:3001)"
echo ""
read -p "Opção [1-2]: " ENV_OPTION

case $ENV_OPTION in
    1)
        ENVIRONMENT="production"
        ENV_URL="http://31.97.255.107:3000"
        CONTAINER_NAME="hallyuhub"
        ;;
    2)
        ENVIRONMENT="staging"
        ENV_URL="http://31.97.255.107:3001"
        CONTAINER_NAME="hallyuhub-staging"
        ;;
    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}⚠ ATENÇÃO:${NC} Você está prestes a fazer rollback em ${ENVIRONMENT}"
echo "URL: ${ENV_URL}"
echo ""

if ! confirm "Deseja continuar?"; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "━━━ OPÇÕES DE ROLLBACK ━━━"
echo ""
echo "1) Rollback para imagem anterior (Docker)"
echo "2) Rollback para tag/commit específico (Git)"
echo "3) Apenas reiniciar container"
echo ""
read -p "Escolha uma opção [1-3]: " ROLLBACK_OPTION

case $ROLLBACK_OPTION in
    1)
        echo ""
        echo -e "${BLUE}ℹ${NC} Buscando imagens disponíveis no servidor..."

        if ! ssh -o BatchMode=yes -o ConnectTimeout=5 ${SSH_USER}@${SSH_HOST} exit 2>/dev/null; then
            echo -e "${RED}✗ Erro: Não foi possível conectar via SSH${NC}"
            echo "Configure: export SSH_USER=seu-usuario"
            exit 1
        fi

        ssh ${SSH_USER}@${SSH_HOST} << ENDSSH
            echo "Imagens Docker disponíveis:"
            docker images ghcr.io/uchidate/khub --format "{{.Tag}} ({{.CreatedAt}})" | head -10
ENDSSH

        echo ""
        read -p "Digite a tag da imagem para rollback (ex: sha-abc123 ou digite 'previous' para anterior): " IMAGE_TAG

        if [ "$IMAGE_TAG" = "previous" ]; then
            # Pega a penúltima imagem
            IMAGE_TAG=$(ssh ${SSH_USER}@${SSH_HOST} "docker images ghcr.io/uchidate/khub --format '{{.Tag}}' | sed -n '2p'")
            echo "Usando tag anterior: ${IMAGE_TAG}"
        fi

        echo ""
        echo -e "${YELLOW}Fazendo rollback para imagem: ghcr.io/uchidate/khub:${IMAGE_TAG}${NC}"

        ssh ${SSH_USER}@${SSH_HOST} << ENDSSH
            cd /var/www/hallyuhub

            # Para o container atual
            echo "Parando container ${CONTAINER_NAME}..."
            docker-compose stop ${CONTAINER_NAME} || true
            docker-compose rm -f ${CONTAINER_NAME} || true

            # Atualiza para usar a imagem específica (temporariamente)
            docker pull ghcr.io/uchidate/khub:${IMAGE_TAG}
            docker tag ghcr.io/uchidate/khub:${IMAGE_TAG} ghcr.io/uchidate/khub:rollback-temp

            # Inicia com a imagem de rollback
            docker-compose up -d ${CONTAINER_NAME}

            echo ""
            echo "✓ Rollback concluído"
            echo "Verificando status..."
            sleep 3
            docker ps | grep ${CONTAINER_NAME}
ENDSSH
        ;;

    2)
        echo ""
        echo "Últimas 10 tags/releases disponíveis:"
        git tag -l --sort=-version:refname | head -10
        echo ""
        read -p "Digite a tag ou commit SHA para rollback: " GIT_REF

        if [ -z "$GIT_REF" ]; then
            echo -e "${RED}Tag/commit não pode ser vazio${NC}"
            exit 1
        fi

        # Verifica se a tag/commit existe
        if ! git rev-parse --verify "$GIT_REF" > /dev/null 2>&1; then
            echo -e "${RED}Tag/commit '$GIT_REF' não encontrada${NC}"
            exit 1
        fi

        echo ""
        echo -e "${YELLOW}Fazendo rollback para: ${GIT_REF}${NC}"
        echo ""

        # Cria uma branch temporária para o rollback
        ROLLBACK_BRANCH="rollback-${GIT_REF}-$(date +%s)"
        git checkout -b ${ROLLBACK_BRANCH} ${GIT_REF}

        echo "Branch temporária criada: ${ROLLBACK_BRANCH}"
        echo ""
        echo "Para fazer deploy deste rollback:"
        echo "  1. git push origin ${ROLLBACK_BRANCH}:${ENVIRONMENT}"
        echo "     (Isso vai triggar o CI/CD para fazer deploy)"
        echo ""
        echo "Ou execute manualmente no servidor com SSH."
        ;;

    3)
        echo ""
        echo -e "${BLUE}ℹ${NC} Apenas reiniciando container..."

        ssh ${SSH_USER}@${SSH_HOST} << ENDSSH
            cd /var/www/hallyuhub

            echo "Reiniciando container ${CONTAINER_NAME}..."
            docker-compose restart ${CONTAINER_NAME}

            echo ""
            echo "✓ Container reiniciado"
            echo "Verificando status..."
            sleep 3
            docker ps | grep ${CONTAINER_NAME}

            echo ""
            echo "Logs recentes:"
            docker logs ${CONTAINER_NAME} --tail 20
ENDSSH
        ;;

    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo "━━━ VERIFICAÇÃO PÓS-ROLLBACK ━━━"
echo ""

# Aguarda alguns segundos para o serviço iniciar
echo "Aguardando serviço iniciar..."
sleep 5

# Tenta health check
echo "Verificando health check..."
for i in {1..5}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${ENV_URL}/api/health 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Serviço está online (HTTP ${HTTP_CODE})${NC}"
        break
    else
        echo "Tentativa $i/5: HTTP ${HTTP_CODE}"
        sleep 3
    fi
done

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}✗ Serviço não respondeu corretamente${NC}"
    echo "Verifique os logs no servidor:"
    echo "  ssh ${SSH_USER}@${SSH_HOST} 'docker logs ${CONTAINER_NAME} --tail 50'"
else
    echo ""
    echo -e "${GREEN}✓ ROLLBACK CONCLUÍDO COM SUCESSO${NC}"
fi

echo ""
