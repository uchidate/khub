#!/bin/bash
# ============================================================
# Staging Cron - HallyuHub
# ============================================================
# Script otimizado para staging que:
# 1. Inicia Ollama container (economiza RAM quando não está em uso)
# 2. Executa atualização de conteúdo via API
# 3. Para Ollama container após uso
#
# Uso: ./scripts/staging-cron.sh
# ============================================================

set -e

# Configurações
COMPOSE_FILE="docker-compose.staging.yml"
OLLAMA_CONTAINER="hallyuhub-ollama-staging"
OLLAMA_STARTUP_TIMEOUT=30
API_ENDPOINT="http://localhost:3001/api/cron/update"
LOG_DIR="/var/www/hallyuhub/logs"
LOG_FILE="${LOG_DIR}/staging-cron-$(date +%Y-%m).log"

# Criar diretório de logs se não existir
mkdir -p "${LOG_DIR}"

# Função para log com timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Função para verificar se Ollama está pronto
is_ollama_ready() {
    docker exec ${OLLAMA_CONTAINER} ollama list >/dev/null 2>&1
}

# Início da execução
log "=========================================="
log "🚀 Iniciando cron de staging (com Ollama on-demand)"
log "=========================================="

# 1. Verificar se Ollama já está rodando
if docker ps --format '{{.Names}}' | grep -q "^${OLLAMA_CONTAINER}$"; then
    log "✅ Ollama já está rodando"
else
    log "🔄 Iniciando Ollama container..."
    cd /var/www/hallyuhub
    docker-compose -f ${COMPOSE_FILE} up -d ${OLLAMA_CONTAINER}

    # Aguardar Ollama ficar pronto
    log "⏳ Aguardando Ollama inicializar (timeout: ${OLLAMA_STARTUP_TIMEOUT}s)..."
    ELAPSED=0
    while ! is_ollama_ready; do
        if [ $ELAPSED -ge $OLLAMA_STARTUP_TIMEOUT ]; then
            log "❌ ERRO: Timeout aguardando Ollama"
            docker-compose -f ${COMPOSE_FILE} stop ${OLLAMA_CONTAINER}
            exit 1
        fi
        sleep 2
        ELAPSED=$((ELAPSED + 2))
    done
    log "✅ Ollama pronto após ${ELAPSED}s"
fi

# 2. Executar atualização via API
log "📡 Chamando endpoint de atualização..."

# Carregar CRON_SECRET do .env.staging
if [ -f /var/www/hallyuhub/.env.staging ]; then
    export $(grep -v '^#' /var/www/hallyuhub/.env.staging | grep 'CRON_SECRET=' | xargs)
fi

# Se não tiver CRON_SECRET, tentar NEXTAUTH_SECRET
if [ -z "$CRON_SECRET" ] && [ -f /var/www/hallyuhub/.env.staging ]; then
    export $(grep -v '^#' /var/www/hallyuhub/.env.staging | grep 'NEXTAUTH_SECRET=' | xargs)
    CRON_SECRET=$NEXTAUTH_SECRET
fi

# Executar requisição
HTTP_CODE=$(curl -s -o /tmp/cron-response.json -w "%{http_code}" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    "${API_ENDPOINT}")

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Atualização concluída (HTTP $HTTP_CODE)"
    # Mostrar resumo do resultado
    if [ -f /tmp/cron-response.json ]; then
        UPDATES=$(jq -r '.results.news.updated + .results.artists.updated + .results.productions.updated' /tmp/cron-response.json 2>/dev/null || echo "?")
        ERRORS=$(jq -r '[.results.news.errors, .results.artists.errors, .results.productions.errors] | add | length' /tmp/cron-response.json 2>/dev/null || echo "?")
        log "📊 Updates: ${UPDATES}, Errors: ${ERRORS}"
    fi
else
    log "⚠️  Atualização retornou HTTP $HTTP_CODE"
    if [ -f /tmp/cron-response.json ]; then
        cat /tmp/cron-response.json >> "${LOG_FILE}"
    fi
fi

# 3. Parar Ollama para economizar recursos
log "💤 Parando Ollama container (economia de ~4GB RAM)..."
cd /var/www/hallyuhub
docker-compose -f ${COMPOSE_FILE} stop ${OLLAMA_CONTAINER}

if docker ps --format '{{.Names}}' | grep -q "^${OLLAMA_CONTAINER}$"; then
    log "⚠️  Ollama ainda está rodando, forçando parada..."
    docker stop ${OLLAMA_CONTAINER}
fi

log "✅ Ollama parado com sucesso"
log "=========================================="
log ""

exit 0
