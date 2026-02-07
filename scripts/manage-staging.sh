#!/bin/bash
# ============================================================
# Staging Management - HallyuHub
# ============================================================
# Controla o ambiente de homologação (porta 3001) para poupar recursos.
# ============================================================

set -e

PROJECT_DIR="/var/www/hallyuhub"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.staging.yml"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

usage() {
    echo "Uso: $0 {start|stop|restart|status|sleep}"
    echo "  start   : Inicia o ambiente de staging"
    echo "  stop    : Para o ambiente de staging"
    echo "  restart : Reinicia o ambiente de staging"
    echo "  status  : Verifica se o staging está rodando"
    echo "  sleep   : Para o staging (alias para stop)"
    exit 1
}

if [ "$#" -ne 1 ]; then
    usage
fi

ACTION=$1

case $ACTION in
    start)
        echo -e "${GREEN}🚀 Iniciando ambiente de STAGING...${NC}"
        docker-compose -f "$COMPOSE_FILE" up -d
        echo -e "${GREEN}✅ Staging iniciado na porta 3001.${NC}"
        ;;
    stop|sleep)
        echo -e "${YELLOW}😴 Colocando STAGING para dormir...${NC}"
        docker-compose -f "$COMPOSE_FILE" stop
        echo -e "${YELLOW}✅ Staging parado. Recursos liberados.${NC}"
        ;;
    restart)
        echo -e "${YELLOW}🔄 Reiniciando STAGING...${NC}"
        docker-compose -f "$COMPOSE_FILE" restart
        ;;
    status)
        echo -e "${YELLOW}📊 Status do STAGING:${NC}"
        docker-compose -f "$COMPOSE_FILE" ps
        ;;
    *)
        usage
        ;;
esac
