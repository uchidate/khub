#!/bin/bash
# health-check.sh
# Health check robusto para todos os ambientes

# Configuração
STAGING_URL="http://31.97.255.107:3001"
PROD_URL="http://31.97.255.107:3000"
TIMEOUT=10

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║            HEALTH CHECK - HALLYUHUB                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Função de health check detalhado
detailed_health_check() {
    local URL=$1
    local NAME=$2

    echo "━━━ ${NAME} ━━━"
    echo "URL: ${URL}"
    echo ""

    # 1. Verifica conectividade básica
    echo -n "1. Conectividade... "
    if curl -s --max-time ${TIMEOUT} -o /dev/null ${URL} 2>/dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ FALHOU${NC}"
        echo "   Servidor não acessível"
        return 1
    fi

    # 2. Verifica endpoint de health
    echo -n "2. Health endpoint... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} ${URL}/api/health 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ HTTP ${HTTP_CODE}${NC}"
    else
        echo -e "${RED}✗ HTTP ${HTTP_CODE}${NC}"
    fi

    # 3. Verifica tempo de resposta
    echo -n "3. Tempo de resposta... "
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time ${TIMEOUT} ${URL}/api/health 2>/dev/null || echo "timeout")

    if [ "$RESPONSE_TIME" != "timeout" ]; then
        # Converte para milissegundos
        MS=$(echo "$RESPONSE_TIME * 1000" | bc)

        if (( $(echo "$RESPONSE_TIME < 1" | bc -l) )); then
            echo -e "${GREEN}✓ ${MS}ms (rápido)${NC}"
        elif (( $(echo "$RESPONSE_TIME < 3" | bc -l) )); then
            echo -e "${YELLOW}⚠ ${MS}ms (moderado)${NC}"
        else
            echo -e "${RED}✗ ${MS}ms (lento)${NC}"
        fi
    else
        echo -e "${RED}✗ Timeout${NC}"
    fi

    # 4. Verifica JSON response
    echo -n "4. JSON response... "
    HEALTH_JSON=$(curl -s --max-time ${TIMEOUT} ${URL}/api/health 2>/dev/null || echo "{}")

    if echo "$HEALTH_JSON" | jq . > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Válido${NC}"

        # Mostra detalhes se disponível
        if echo "$HEALTH_JSON" | jq -e '.ok' > /dev/null 2>&1; then
            OK_STATUS=$(echo "$HEALTH_JSON" | jq -r '.ok')
            if [ "$OK_STATUS" = "true" ]; then
                echo "   Status: ok = true"
            else
                echo -e "   ${YELLOW}Status: ok = false${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠ Inválido ou não disponível${NC}"
    fi

    # 5. Verifica headers
    echo -n "5. Headers... "
    CONTENT_TYPE=$(curl -s -I --max-time ${TIMEOUT} ${URL}/api/health 2>/dev/null | grep -i "content-type" | cut -d: -f2 | tr -d '[:space:]')

    if [[ "$CONTENT_TYPE" == *"application/json"* ]]; then
        echo -e "${GREEN}✓ application/json${NC}"
    else
        echo -e "${YELLOW}⚠ ${CONTENT_TYPE}${NC}"
    fi

    # 6. Verifica SSL/TLS (se HTTPS)
    if [[ "$URL" == https://* ]]; then
        echo -n "6. SSL/TLS... "
        SSL_INFO=$(curl -s -I --max-time ${TIMEOUT} ${URL} 2>&1)

        if echo "$SSL_INFO" | grep -q "SSL certificate problem"; then
            echo -e "${RED}✗ Problema com certificado${NC}"
        else
            echo -e "${GREEN}✓ OK${NC}"
        fi
    fi

    echo ""
}

# Executa health check para cada ambiente
detailed_health_check "${STAGING_URL}" "STAGING (Homologação)"
detailed_health_check "${PROD_URL}" "PRODUCTION (Produção)"

# Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STAGING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} ${STAGING_URL}/api/health 2>/dev/null || echo "000")
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} ${PROD_URL}/api/health 2>/dev/null || echo "000")

echo -n "Staging:    "
if [ "$STAGING_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Online${NC}"
else
    echo -e "${RED}✗ Offline (HTTP ${STAGING_STATUS})${NC}"
fi

echo -n "Production: "
if [ "$PROD_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Online${NC}"
else
    echo -e "${RED}✗ Offline (HTTP ${PROD_STATUS})${NC}"
fi

echo ""

# Exit code baseado nos resultados
if [ "$STAGING_STATUS" = "200" ] && [ "$PROD_STATUS" = "200" ]; then
    exit 0
else
    exit 1
fi
