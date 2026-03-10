#!/bin/bash
# ============================================================
# Monitor Health - HallyuHub
# ============================================================
# Monitora a saúde do sistema via HTTP direto (sem docker exec)
# Executa a cada 30 minutos via cron
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/health-monitor-$(date +%Y-%m).log"

mkdir -p "${LOG_DIR}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Carregar Slack webhook do arquivo de env
SLACK_WEBHOOK=""
for ENV_FILE in "${PROJECT_DIR}/.env.production" "${PROJECT_DIR}/.env.staging" "${PROJECT_DIR}/.env"; do
    if [ -f "$ENV_FILE" ]; then
        SLACK_WEBHOOK=$(grep '^SLACK_WEBHOOK_ALERTS=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
        [ -n "$SLACK_WEBHOOK" ] && break
    fi
done

notify_slack() {
    local msg="$1"
    [ -n "$SLACK_WEBHOOK" ] || return 0
    curl -s -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"$msg\"}" > /dev/null 2>&1 || true
}

# Health check via HTTP na porta local (sem docker exec = sem risco de OOM)
HEALTH_URL="http://localhost:3000/api/health"

log "=========================================="
log "Iniciando monitoramento de saúde"
log "=========================================="

RESPONSE=$(curl -sf --max-time 10 "$HEALTH_URL" 2>/dev/null)
CURL_EXIT=$?

if [ $CURL_EXIT -ne 0 ]; then
    log "❌ Falha ao acessar ${HEALTH_URL} (exit: ${CURL_EXIT})"
    notify_slack "🚨 *[Health Monitor]* Não foi possível acessar \`/api/health\` — production pode estar down"
    log "=========================================="
    exit 1
fi

OK=$(echo "$RESPONSE" | python3 -c "import sys,json; print('true' if json.load(sys.stdin).get('ok') else 'false')" 2>/dev/null || echo "unknown")

if [ "$OK" = "true" ]; then
    log "✅ Sistema saudável"
elif [ "$OK" = "false" ]; then
    log "⚠️ Health check retornou ok=false"
    notify_slack "⚠️ *[Health Monitor]* Sistema degradado — \`/api/health\` retornou \`ok: false\`"
else
    log "⚠️ Resposta inesperada do health endpoint"
fi

log "=========================================="
