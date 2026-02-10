#!/bin/bash
# ============================================================
# Monitor Health - HallyuHub
# ============================================================
# Script executado pelo cron para monitorar a saúde do sistema
# Executa a cada 30 minutos
# ============================================================

set -e

# Diretório do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/health-monitor-$(date +%Y-%m).log"

# Criar diretório de logs se não existir
mkdir -p "${LOG_DIR}"

# Busca exaustiva por binários
find_bin() {
    local name=$1
    local common_paths=("/usr/local/bin/$name" "/usr/bin/$name" "/bin/$name" "/usr/sbin/$name")
    for path in "${common_paths[@]}"; do
        if [ -x "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    command -v "$name" || echo "$name"
}

DOCKER_BIN=$(find_bin docker)
NPM_BIN=$(find_bin npm)

# Função para log com timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "=========================================="
log "Iniciando monitoramento de saúde"
log "=========================================="

cd "${PROJECT_DIR}"

# Carregar variáveis de ambiente
ENV_FILE=""
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
elif [ -f ".env.staging" ]; then
    ENV_FILE=".env.staging"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ -n "$ENV_FILE" ]; then
    log "Carregando $ENV_FILE"
    while IFS= read -r line || [[ -n "$line" ]]; do
        if [[ ! "$line" =~ ^# ]] && [[ -n "$line" ]]; then
            export "$line"
        fi
    done < "$ENV_FILE"
fi

# Executar monitor via Docker ou local
CONTAINER_NAME="hallyuhub"
if $DOCKER_BIN ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log "Executando via Docker..."
    $DOCKER_BIN exec \
        -e NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
        -e SLACK_WEBHOOK_ALERTS="$SLACK_WEBHOOK_ALERTS" \
        "${CONTAINER_NAME}" npm run monitor:health >> "${LOG_FILE}" 2>&1
    EXIT_CODE=$?
else
    log "Executando via npm local..."
    "$NPM_BIN" run monitor:health >> "${LOG_FILE}" 2>&1
    EXIT_CODE=$?
fi

if [ $EXIT_CODE -eq 0 ]; then
    log "✅ Monitoramento concluído"
else
    log "❌ Erro no monitoramento (exit code: $EXIT_CODE)"
fi

log "=========================================="
exit $EXIT_CODE
