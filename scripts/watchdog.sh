#!/bin/bash
# ============================================================
# Watchdog — HallyuHub Auto-Recovery (Production + Staging)
# ============================================================
# Monitora os containers hallyuhub e hallyuhub-staging a cada minuto.
# Se não responderem ao health check, aguarda 15s e tenta novamente.
# Se ainda falhar, reinicia o container e notifica via Slack.
#
# Cron entry (instalado pelo deploy.yml):
#   * * * * * /var/www/hallyuhub/scripts/watchdog.sh >> /var/log/hallyuhub-watchdog.log 2>&1
# ============================================================

set -euo pipefail

TIMEOUT=10
LOG_PREFIX="[watchdog $(date '+%Y-%m-%d %H:%M:%S')]"

# Ambientes monitorados: CONTAINER|HEALTH_URL|LABEL
ENVS=(
  "hallyuhub|https://www.hallyuhub.com.br/api/health|Production"
  "hallyuhub-staging|http://127.0.0.1:3001/api/health|Staging"
)

# Carrega SLACK_WEBHOOK_ALERTS se disponível
SLACK_WEBHOOK="${SLACK_WEBHOOK_ALERTS:-}"
ENV_FILE="/var/www/hallyuhub/.env.production"
if [ -f "$ENV_FILE" ] && [ -z "$SLACK_WEBHOOK" ]; then
    SLACK_WEBHOOK=$(grep '^SLACK_WEBHOOK_ALERTS=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
fi

notify_slack() {
    local msg="$1"
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$msg\"}" > /dev/null 2>&1 || true
    fi
}

watch_container() {
    local CONTAINER="$1"
    local HEALTH_URL="$2"
    local LABEL="$3"

    check_health() {
        curl -sf --max-time "$TIMEOUT" "$HEALTH_URL" > /dev/null 2>&1
    }

    STATE=$(docker inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")

    # Container reiniciando → Docker já está cuidando
    [ "$STATE" = "restarting" ] && echo "$LOG_PREFIX [$LABEL] Reiniciando — aguardando Docker" && return 0
    # Container não existe → deploy em andamento ou desligado intencionalmente
    [ "$STATE" = "missing" ]    && return 0
    # Container parado intencionalmente → não interferir
    [ "$STATE" = "exited" ]     && return 0

    # Verifica health check HTTP
    check_health && return 0

    echo "$LOG_PREFIX [$LABEL] ALERTA: Health check falhou (tentativa 1)"

    # Segunda chance após 15s (evita falso positivo durante restart normal)
    sleep 15
    check_health && echo "$LOG_PREFIX [$LABEL] OK após aguardar — falso positivo" && return 0

    echo "$LOG_PREFIX [$LABEL] ALERTA: Health check falhou (tentativa 2) — reiniciando container"

    docker restart --time 10 "$CONTAINER" 2>&1 || {
        echo "$LOG_PREFIX [$LABEL] ERRO: Falha ao reiniciar container"
        notify_slack "🚨 *[Watchdog $LABEL]* Falha ao reiniciar \`$CONTAINER\` — intervenção manual necessária!"
        return 1
    }

    echo "$LOG_PREFIX [$LABEL] Container reiniciado. Aguardando health check..."

    for i in $(seq 1 12); do
        sleep 5
        if check_health; then
            echo "$LOG_PREFIX [$LABEL] Recuperado após ${i}x5s"
            notify_slack "✅ *[Watchdog $LABEL]* Container \`$CONTAINER\` reiniciado e respondendo normalmente."
            return 0
        fi
    done

    echo "$LOG_PREFIX [$LABEL] App NÃO respondeu após 60s pós-restart"
    notify_slack "🚨 *[Watchdog $LABEL]* Container \`$CONTAINER\` reiniciado mas não respondeu em 60s — \`docker logs $CONTAINER --tail 50\`"
    return 1
}

# Monitora cada ambiente (falhas individuais não interrompem o loop)
for env_entry in "${ENVS[@]}"; do
    CONTAINER=$(echo "$env_entry" | cut -d'|' -f1)
    HEALTH_URL=$(echo "$env_entry" | cut -d'|' -f2)
    LABEL=$(echo "$env_entry"     | cut -d'|' -f3)
    watch_container "$CONTAINER" "$HEALTH_URL" "$LABEL" || true
done
