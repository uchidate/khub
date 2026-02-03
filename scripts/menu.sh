#!/bin/bash
# menu.sh
# Menu interativo para facilitar uso dos scripts

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

show_menu() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              HALLYUHUB - MENU PRINCIPAL                   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}VERIFICAÇÕES:${NC}"
    echo "  1) Quick Check - Verificação rápida de tudo"
    echo "  2) Check All - Verificação completa de versões"
    echo "  3) Check Local - Apenas ambiente local"
    echo "  4) Check Staging - Apenas staging"
    echo "  5) Check Production - Apenas production"
    echo "  6) Check Server - Verificação no servidor (SSH)"
    echo ""
    echo -e "${CYAN}VALIDAÇÃO E DEPLOY:${NC}"
    echo "  7) Pre-Deploy Validation - Validar antes de deploy"
    echo "  8) Bump Version - Atualizar versão"
    echo "  9) Deploy to Staging - Deploy para homologação"
    echo " 10) Deploy to Production - Deploy para produção"
    echo ""
    echo -e "${CYAN}MONITORAMENTO:${NC}"
    echo " 11) Health Check - Verificação de saúde detalhada"
    echo " 12) Monitor - Monitoramento contínuo"
    echo ""
    echo -e "${CYAN}EMERGÊNCIA:${NC}"
    echo " 13) Rollback - Reverter deploy problemático"
    echo ""
    echo -e "${CYAN}DESENVOLVIMENTO:${NC}"
    echo " 14) Dev Server - Iniciar servidor de desenvolvimento"
    echo " 15) Build - Compilar projeto"
    echo " 16) Setup - Configuração inicial completa"
    echo ""
    echo " 0) Sair"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -n "Escolha uma opção [0-16]: "
}

pause() {
    echo ""
    read -p "Pressione ENTER para continuar..."
}

while true; do
    show_menu
    read choice

    case $choice in
        1)
            echo -e "\n${GREEN}Executando Quick Check...${NC}\n"
            ./scripts/quick-check.sh
            pause
            ;;
        2)
            echo -e "\n${GREEN}Executando Check All...${NC}\n"
            ./scripts/version-check/check-all-versions.sh
            pause
            ;;
        3)
            echo -e "\n${GREEN}Executando Check Local...${NC}\n"
            ./scripts/version-check/check-local-version.sh
            pause
            ;;
        4)
            echo -e "\n${GREEN}Executando Check Staging...${NC}\n"
            ./scripts/version-check/check-staging-version.sh
            pause
            ;;
        5)
            echo -e "\n${GREEN}Executando Check Production...${NC}\n"
            ./scripts/version-check/check-production-version.sh
            pause
            ;;
        6)
            echo -e "\n${GREEN}Executando Check Server...${NC}\n"
            if [ -z "$SSH_USER" ]; then
                echo -e "${YELLOW}Configure SSH_USER primeiro:${NC}"
                read -p "Digite seu usuário SSH: " ssh_user
                export SSH_USER=$ssh_user
            fi
            ./scripts/version-check/check-server-versions.sh
            pause
            ;;
        7)
            echo -e "\n${GREEN}Executando Pre-Deploy Validation...${NC}\n"
            ./scripts/pre-deploy-validation.sh
            pause
            ;;
        8)
            echo -e "\n${GREEN}Executando Bump Version...${NC}\n"
            ./scripts/bump-version.sh
            pause
            ;;
        9)
            echo -e "\n${YELLOW}Deploy to Staging${NC}\n"
            echo "Isso vai fazer push para a branch develop e triggar deploy automático."
            read -p "Deseja continuar? [y/N]: " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                ./scripts/pre-deploy-validation.sh
                if [ $? -eq 0 ]; then
                    git checkout develop
                    git push origin develop
                    echo -e "\n${GREEN}Deploy iniciado! Acompanhe em GitHub Actions.${NC}"
                else
                    echo -e "\n${RED}Validação falhou. Corrija os erros primeiro.${NC}"
                fi
            fi
            pause
            ;;
        10)
            echo -e "\n${YELLOW}Deploy to Production${NC}\n"
            echo "Isso vai fazer push para a branch main e triggar deploy automático."
            echo -e "${RED}ATENÇÃO: Isso afeta o ambiente de PRODUÇÃO!${NC}"
            read -p "Deseja continuar? [y/N]: " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                ./scripts/pre-deploy-validation.sh
                if [ $? -eq 0 ]; then
                    git checkout main
                    git push origin main
                    echo -e "\n${GREEN}Deploy iniciado! Acompanhe em GitHub Actions.${NC}"
                else
                    echo -e "\n${RED}Validação falhou. Corrija os erros primeiro.${NC}"
                fi
            fi
            pause
            ;;
        11)
            echo -e "\n${GREEN}Executando Health Check...${NC}\n"
            ./scripts/health-check.sh
            pause
            ;;
        12)
            echo -e "\n${GREEN}Iniciando Monitoramento Contínuo...${NC}"
            echo -e "${YELLOW}Pressione Ctrl+C para parar${NC}\n"
            sleep 2
            ./scripts/monitor.sh
            pause
            ;;
        13)
            echo -e "\n${YELLOW}Executando Rollback...${NC}\n"
            if [ -z "$SSH_USER" ]; then
                echo -e "${YELLOW}Configure SSH_USER primeiro:${NC}"
                read -p "Digite seu usuário SSH: " ssh_user
                export SSH_USER=$ssh_user
            fi
            ./scripts/rollback.sh
            pause
            ;;
        14)
            echo -e "\n${GREEN}Iniciando Dev Server...${NC}\n"
            cd v1 && npm run dev
            pause
            ;;
        15)
            echo -e "\n${GREEN}Building projeto...${NC}\n"
            cd v1 && npm run build
            pause
            ;;
        16)
            echo -e "\n${GREEN}Executando Setup Completo...${NC}\n"
            echo "Instalando dependências..."
            cd v1 && npm install
            echo ""
            if [ ! -f v1/.env ]; then
                echo "Copiando .env.example para .env..."
                cp v1/.env.example v1/.env
                echo -e "${YELLOW}Configure as variáveis em v1/.env antes de continuar${NC}"
            fi
            echo ""
            echo "Gerando Prisma Client..."
            npx prisma generate
            echo ""
            echo -e "${GREEN}✓ Setup concluído!${NC}"
            pause
            ;;
        0)
            echo -e "\n${GREEN}Até logo!${NC}\n"
            exit 0
            ;;
        *)
            echo -e "\n${RED}Opção inválida!${NC}"
            pause
            ;;
    esac
done
