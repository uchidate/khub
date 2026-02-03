#!/bin/bash
# monitor.sh
# Script de monitoramento contínuo dos ambientes

# Configuração
STAGING_URL="http://31.97.255.107:3001"
PROD_URL="http://31.97.255.107:3000"
CHECK_INTERVAL=30  # segundos
LOG_FILE="monitor.log"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         MONITORAMENTO CONTÍNUO - HALLYUHUB                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Monitorando staging e production a cada ${CHECK_INTERVAL} segundos"
echo "Pressione Ctrl+C para parar"
echo ""
echo "Log sendo salvo em: ${LOG_FILE}"
echo ""

# Função para verificar saúde de um endpoint
check_health() {
    local URL=$1
    local NAME=$2
    local TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Tenta conectar
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 ${URL}/api/health 2>/dev/null || echo "000")
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 ${URL}/api/health 2>/dev/null || echo "timeout")

    # Log em arquivo
    echo "${TIMESTAMP} | ${NAME} | HTTP ${HTTP_CODE} | Tempo: ${RESPONSE_TIME}s" >> ${LOG_FILE}

    # Output na tela
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "[${TIMESTAMP}] ${GREEN}✓${NC} ${NAME}: Online (${RESPONSE_TIME}s)"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "[${TIMESTAMP}] ${RED}✗${NC} ${NAME}: Timeout ou unreachable"

        # Tenta notificar (se tiver sistema de notificação configurado)
        # Exemplo: send_alert "${NAME} está offline!"
    else
        echo -e "[${TIMESTAMP}] ${YELLOW}⚠${NC} ${NAME}: HTTP ${HTTP_CODE} (${RESPONSE_TIME}s)"
    fi
}

# Função para enviar alerta (pode ser customizada)
send_alert() {
    local MESSAGE=$1
    # Aqui você pode integrar com Slack, Discord, email, etc.
    # Exemplo: curl -X POST https://hooks.slack.com/... -d "{\"text\":\"$MESSAGE\"}"
    echo "ALERTA: ${MESSAGE}" >> ${LOG_FILE}
}

# Loop de monitoramento
ITERATION=0
while true; do
    ITERATION=$((ITERATION + 1))

    echo "━━━ Verificação #${ITERATION} ━━━"

    check_health "${STAGING_URL}" "STAGING "
    check_health "${PROD_URL}" "PRODUCTION"

    echo ""

    # Aguarda próximo check
    sleep ${CHECK_INTERVAL}
done
