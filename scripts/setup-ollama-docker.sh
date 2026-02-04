#!/bin/bash
# ============================================================
# Setup Ollama Docker - Baixar modelo phi3
# ============================================================
# Uso: bash setup-ollama-docker.sh [staging|production]
# ============================================================

set -e

# Parse argumentos
ENV="${1:-production}"

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
    echo "Erro: Ambiente deve ser 'staging' ou 'production'"
    echo "Uso: bash setup-ollama-docker.sh [staging|production]"
    exit 1
fi

# Configurar nomes baseado no ambiente
if [[ "$ENV" == "staging" ]]; then
    CONTAINER_NAME="hallyuhub-ollama-staging"
    MODEL="phi3"
else
    CONTAINER_NAME="hallyuhub-ollama-production"
    MODEL="phi3"
fi

echo "=========================================="
echo "  SETUP OLLAMA - ${ENV^^}"
echo "=========================================="
echo "  Container: ${CONTAINER_NAME}"
echo "  Modelo:    ${MODEL}"
echo "=========================================="
echo ""

# Verificar se o container existe e está rodando
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "Erro: Container ${CONTAINER_NAME} não está rodando"
    echo ""
    echo "Inicie os containers primeiro:"
    if [[ "$ENV" == "staging" ]]; then
        echo "  docker-compose -f docker-compose.staging.yml up -d"
    else
        echo "  docker-compose -f docker-compose.prod.yml up -d"
    fi
    exit 1
fi

echo "✓ Container ${CONTAINER_NAME} está rodando"
echo ""

# Verificar modelos já instalados
echo "Verificando modelos instalados..."
INSTALLED_MODELS=$(docker exec "${CONTAINER_NAME}" ollama list 2>/dev/null || echo "")

if echo "$INSTALLED_MODELS" | grep -q "${MODEL}"; then
    echo "✓ Modelo ${MODEL} já está instalado"
    echo ""
    docker exec "${CONTAINER_NAME}" ollama list
else
    echo "Baixando modelo ${MODEL}..."
    echo "Isso pode levar alguns minutos (modelo tem ~2.2GB)..."
    echo ""

    docker exec "${CONTAINER_NAME}" ollama pull "${MODEL}"

    echo ""
    echo "✓ Modelo ${MODEL} instalado com sucesso"
fi

echo ""
echo "=========================================="
echo "  TESTANDO OLLAMA"
echo "=========================================="

# Testar o modelo
echo "Testando geração de texto..."
RESPONSE=$(docker exec "${CONTAINER_NAME}" ollama run "${MODEL}" "Diga apenas: OK" 2>&1 || echo "ERRO")

if echo "$RESPONSE" | grep -qi "ok"; then
    echo "✓ Ollama funcionando corretamente!"
else
    echo "⚠ Teste pode ter falhado. Resposta:"
    echo "$RESPONSE"
fi

echo ""
echo "=========================================="
echo "  INFORMAÇÕES"
echo "=========================================="
echo ""
echo "Modelos instalados:"
docker exec "${CONTAINER_NAME}" ollama list
echo ""
echo "URL do Ollama dentro do Docker:"
if [[ "$ENV" == "staging" ]]; then
    echo "  http://ollama-staging:11434"
else
    echo "  http://ollama-production:11434"
fi
echo ""
echo "Para testar manualmente:"
echo "  docker exec -it ${CONTAINER_NAME} ollama run ${MODEL}"
echo ""
echo "=========================================="
echo "✓ Setup completo!"
echo "=========================================="
