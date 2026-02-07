#!/bin/bash
# ============================================================
# Emergency CPU Mitigation - HallyuHub
# ============================================================
# Executa ações imediatas para baixar a utilização de CPU.
# ============================================================

set -e

PROJECT_DIR="/var/www/hallyuhub"
COMPOSE_PROD="${PROJECT_DIR}/docker-compose.prod.yml"
COMPOSE_STAGING="${PROJECT_DIR}/docker-compose.staging.yml"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}⚠️  INICIANDO MITIGAÇÃO DE EMERGÊNCIA DE CPU...${NC}"

# 1. Parar Staging Imediatamente
echo -e "\n${YELLOW}1. Parando ambiente de homologação (Staging)...${NC}"
docker-compose -f "$COMPOSE_STAGING" stop || echo "Staging já estava parado ou erro ao parar."

# 2. Reiniciar Produção para aplicar LIMITES de CPU
echo -e "\n${YELLOW}2. Reiniciando Produção com novos limites de CPU (0.8 cores)...${NC}"
docker-compose -f "$COMPOSE_PROD" up -d

# 3. Limpar Docker (remover processos órfãos e lixo)
echo -e "\n${YELLOW}3. Limpando recursos Docker não utilizados...${NC}"
docker system prune -f

# 4. Verificar status do Ollama (o maior vilão de CPU)
echo -e "\n${YELLOW}4. Resetando Ollama para interromper gerações pesadas pendentes...${NC}"
docker restart hallyuhub-ollama-production

echo -e "\n${GREEN}✅ AÇÕES DE EMERGÊNCIA CONCLUÍDAS!${NC}"
echo -e "A CPU deve baixar nos próximos 30-60 segundos."
echo -e "Produção continua ONLINE na porta 3000."
echo -e "Staging (porta 3001) está OFFLINE para poupar recursos."
