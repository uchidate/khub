#!/bin/bash
# ============================================================
# Script de Teste do Ollama
# ============================================================
# Uso: bash test-ollama.sh [staging|production]
# ============================================================

set -e

ENV="${1:-staging}"

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
    echo "Erro: Ambiente deve ser 'staging' ou 'production'"
    echo "Uso: bash test-ollama.sh [staging|production]"
    exit 1
fi

# Configurar variáveis baseado no ambiente
if [[ "$ENV" == "staging" ]]; then
    CONTAINER_NAME="hallyuhub-ollama-staging"
    APP_CONTAINER="hallyuhub-staging"
    PORT="3001"
    OLLAMA_URL="http://ollama-staging:11434"
else
    CONTAINER_NAME="hallyuhub-ollama-production"
    APP_CONTAINER="hallyuhub"
    PORT="3000"
    OLLAMA_URL="http://ollama-production:11434"
fi

echo "=========================================="
echo "  TESTE DO OLLAMA - ${ENV^^}"
echo "=========================================="
echo ""

# Teste 1: Verificar se container está rodando
echo "1️⃣  Verificando container Ollama..."
if docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "   ✅ Container ${CONTAINER_NAME} está rodando"
else
    echo "   ❌ Container ${CONTAINER_NAME} NÃO está rodando"
    exit 1
fi
echo ""

# Teste 2: Verificar modelos instalados
echo "2️⃣  Verificando modelos instalados..."
MODELS=$(docker exec "${CONTAINER_NAME}" ollama list 2>/dev/null || echo "ERRO")
if echo "$MODELS" | grep -q "phi3"; then
    echo "   ✅ Modelo phi3 está instalado"
    echo ""
    docker exec "${CONTAINER_NAME}" ollama list | head -5
else
    echo "   ❌ Modelo phi3 NÃO está instalado"
    echo "   Execute: ./scripts/setup-ollama-docker.sh ${ENV}"
    exit 1
fi
echo ""

# Teste 3: Testar geração dentro do container Ollama
echo "3️⃣  Testando geração no container Ollama..."
RESPONSE=$(docker exec "${CONTAINER_NAME}" ollama run phi3 "Responda apenas: OK" 2>&1 | head -10)
if echo "$RESPONSE" | grep -qi "ok"; then
    echo "   ✅ Geração funcionando no container Ollama"
else
    echo "   ⚠️  Resposta do Ollama:"
    echo "$RESPONSE" | head -5
fi
echo ""

# Teste 4: Testar conectividade da aplicação
echo "4️⃣  Testando conectividade da aplicação..."
if docker ps | grep -q "${APP_CONTAINER}"; then
    CONN_TEST=$(docker exec "${APP_CONTAINER}" curl -s "${OLLAMA_URL}/api/tags" 2>/dev/null || echo "ERRO")
    if echo "$CONN_TEST" | grep -q "models"; then
        echo "   ✅ Aplicação consegue conectar no Ollama"
    else
        echo "   ❌ Aplicação NÃO consegue conectar no Ollama"
        echo "   URL: ${OLLAMA_URL}"
        echo "   Resposta: ${CONN_TEST}"
    fi
else
    echo "   ⚠️  Container da aplicação não está rodando"
fi
echo ""

# Teste 5: Testar endpoint /api/health
echo "5️⃣  Testando endpoint /api/health..."
HEALTH=$(curl -s "http://localhost:${PORT}/api/health" 2>/dev/null || echo "ERRO")
if echo "$HEALTH" | grep -q "ollama"; then
    echo "   ✅ Endpoint /api/health responde"
    echo ""
    echo "$HEALTH" | grep -A 5 "ollama" || echo "$HEALTH" | head -20
else
    echo "   ❌ Endpoint /api/health não responde ou Ollama não aparece"
    echo "   Resposta: ${HEALTH}"
fi
echo ""

# Teste 6: Verificar uso de recursos
echo "6️⃣  Uso de recursos do container..."
docker stats "${CONTAINER_NAME}" --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

# Teste 7: Verificar logs recentes
echo "7️⃣  Logs recentes do Ollama (últimas 5 linhas)..."
docker logs "${CONTAINER_NAME}" --tail 5 2>&1 || echo "   Sem logs"
echo ""

echo "=========================================="
echo "  RESUMO"
echo "=========================================="
echo ""
echo "Container:    ${CONTAINER_NAME}"
echo "URL Interna:  ${OLLAMA_URL}"
echo "Porta App:    ${PORT}"
echo ""

# Verificar se tudo passou
if docker ps | grep -q "${CONTAINER_NAME}" && \
   docker exec "${CONTAINER_NAME}" ollama list 2>/dev/null | grep -q "phi3"; then
    echo "Status: ✅ OLLAMA FUNCIONANDO"
    echo ""
    echo "Próximo passo: Testar geração de conteúdo"
    echo "  npm run atualize:ai -- --news 1 --artists 1"
else
    echo "Status: ❌ PROBLEMAS DETECTADOS"
    echo ""
    echo "Verifique os erros acima e:"
    echo "  1. Certifique-se que o container está rodando"
    echo "  2. Execute: ./scripts/setup-ollama-docker.sh ${ENV}"
fi
echo ""
echo "=========================================="
