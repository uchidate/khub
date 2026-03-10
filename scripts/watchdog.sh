#!/bin/bash
# ============================================================
# Watchdog — HallyuHub Production Auto-Recovery
# ============================================================
# Monitora o container hallyuhub a cada minuto (via cron).
# Se não responder ao health check, aguarda 15s e tenta novamente.
# Se ainda falhar, reinicia o container e notifica via Slack.
#
# Cron entry (instalado pelo deploy.yml):
#   * * * * * /var/www/hallyuhub/scripts/watchdog.sh >> /var/log/hallyuhub-watchdog.log 2>&1
# ============================================================

set -euo pipefail

CONTAINER="hallyuhub"
HEALTH_URL="https://www.hallyuhub.com.br/api/health"
TIMEOUT=10
LOG_PREFIX="[watchdog $(date '+%Y-%m-%d %H:%M:%S')]"

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

check_health() {
    curl -sf --max-time "$TIMEOUT" "$HEALTH_URL" > /dev/null 2>&1
}

container_state() {
    docker inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "missing"
}

# Se container está reiniciando, aguardar (Docker já está cuidando disso)
STATE=$(container_state)
if [ "$STATE" = "restarting" ]; then
    echo "$LOG_PREFIX Container está reiniciando — aguardando Docker"
    exit 0
fi

# Se container não existe, nada a fazer (deploy em andamento)
if [ "$STATE" = "missing" ]; then
    echo "$LOG_PREFIX Container não encontrado — deploy em andamento?"
    exit 0
fi

# Verifica health check HTTP
if check_health; then
    # Tudo OK — sai silenciosamente (não polui o log)
    exit 0
fi

echo "$LOG_PREFIX ALERTA: Health check falhou (tentativa 1)"

# Segunda chance: aguarda 15s e tenta de novo (evita falso positivo durante restart normal)
sleep 15

if check_health; then
    echo "$LOG_PREFIX OK após aguardar — falso positivo"
    exit 0
fi

echo "$LOG_PREFIX ALERTA: Health check falhou (tentativa 2) — reiniciando container"

# Reinicia o container graciosamente (SIGTERM → espera 10s → SIGKILL)
docker restart --time 10 "$CONTAINER" 2>&1 || {
    echo "$LOG_PREFIX ERRO: Falha ao reiniciar container"
    notify_slack "🚨 *[Watchdog Production]* Falha ao reiniciar container \`$CONTAINER\` — intervenção manual necessária!"
    exit 1
}

echo "$LOG_PREFIX Container reiniciado. Aguardando health check..."

# Aguarda o app subir (máx 60s)
for i in $(seq 1 12); do
    sleep 5
    if check_health; then
        echo "$LOG_PREFIX App recuperado após ${i}x5s"
        notify_slack "✅ *[Watchdog Production]* Container \`$CONTAINER\` reiniciado com sucesso e respondendo normalmente."
        exit 0
    fi
done

echo "$LOG_PREFIX App NÃO respondeu após 60s pós-restart"
notify_slack "🚨 *[Watchdog Production]* Container \`$CONTAINER\` reiniciado mas não respondeu em 60s — verificar logs: \`docker logs $CONTAINER --tail 50\`"
exit 1
