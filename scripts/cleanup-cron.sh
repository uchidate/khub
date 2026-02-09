#!/bin/bash
# ============================================================
# Script de Limpeza Automática do Servidor (Cron Job)
# Executa diariamente às 3h da manhã para manter o servidor limpo
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/www/hallyuhub/logs"
CLEANUP_LOG="${LOG_DIR}/cleanup-$(date +%Y-%m).log"

# Criar diretório de logs se não existir
mkdir -p "$LOG_DIR"

# Função de log
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$CLEANUP_LOG"
}

# Função para exibir espaço em disco
show_disk_space() {
    local label=$1
    log "📊 $label:"
    df -h /var/www/hallyuhub 2>/dev/null | grep -v Filesystem | awk '{print "   Usado: "$3" / Disponível: "$4" / Total: "$2" ("$5")"}' | tee -a "$CLEANUP_LOG" || \
    df -h / | grep -v Filesystem | awk '{print "   Usado: "$3" / Disponível: "$4" / Total: "$2" ("$5")"}' | tee -a "$CLEANUP_LOG"
}

log "=========================================="
log "🧹 Iniciando limpeza automática do servidor"
log "=========================================="

# 1. Mostrar espaço ANTES da limpeza
show_disk_space "Espaço em disco ANTES da limpeza"

# 2. Limpar logs antigos (manter últimos 7 dias)
log ""
log "📝 Limpando logs antigos (mantendo últimos 7 dias)..."

if [ -d "$LOG_DIR" ]; then
    # Limpar logs de cron
    LOGS_REMOVED=$(find "$LOG_DIR" -name "*.log" -type f -mtime +7 2>/dev/null | wc -l)
    find "$LOG_DIR" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

    # Limpar logs de cleanup antigos (manter últimos 2 meses)
    find "$LOG_DIR" -name "cleanup-*.log" -type f -mtime +60 -delete 2>/dev/null || true

    log "✅ $LOGS_REMOVED arquivos de log antigos removidos"
else
    log "⚠️  Diretório de logs não encontrado: $LOG_DIR"
    LOGS_REMOVED=0
fi

# 3. Limpar imagens Docker não utilizadas
log ""
log "🐳 Limpando imagens Docker não utilizadas..."

# Listar imagens antes
IMAGES_BEFORE=$(docker images -q 2>/dev/null | wc -l)

# Remover imagens órfãs (dangling)
docker image prune -f >> "$CLEANUP_LOG" 2>&1 || true

# Remover imagens antigas do hallyuhub (manter últimas 3 versões)
log "   Mantendo apenas últimas 3 versões das imagens hallyuhub..."
docker images ghcr.io/uchidate/khub --format "{{.ID}}" 2>/dev/null | tail -n +4 | xargs -r docker rmi -f >> "$CLEANUP_LOG" 2>&1 || true

# Listar imagens depois
IMAGES_AFTER=$(docker images -q 2>/dev/null | wc -l)
IMAGES_REMOVED=$((IMAGES_BEFORE - IMAGES_AFTER))

log "✅ $IMAGES_REMOVED imagens Docker removidas"

# 4. Limpar build cache do Docker (manter últimos 7 dias)
log ""
log "🗑️  Limpando build cache do Docker..."
CACHE_SIZE_BEFORE=$(docker system df 2>/dev/null | grep 'Build Cache' | awk '{print $4}' || echo "0B")
docker builder prune -f --filter "until=168h" >> "$CLEANUP_LOG" 2>&1 || true
CACHE_SIZE_AFTER=$(docker system df 2>/dev/null | grep 'Build Cache' | awk '{print $4}' || echo "0B")
log "✅ Build cache limpo (antes: $CACHE_SIZE_BEFORE → depois: $CACHE_SIZE_AFTER)"

# 5. Limpar containers parados (manter apenas últimos 2)
log ""
log "📦 Limpando containers parados..."
CONTAINERS_BEFORE=$(docker ps -aq -f status=exited 2>/dev/null | wc -l)

# Manter apenas os 2 containers parados mais recentes
docker ps -aq -f status=exited 2>/dev/null | tail -n +3 | xargs -r docker rm >> "$CLEANUP_LOG" 2>&1 || true

CONTAINERS_AFTER=$(docker ps -aq -f status=exited 2>/dev/null | wc -l)
CONTAINERS_REMOVED=$((CONTAINERS_BEFORE - CONTAINERS_AFTER))

log "✅ $CONTAINERS_REMOVED containers parados removidos"

# 6. Limpar volumes órfãos (NÃO remove volumes em uso)
log ""
log "💾 Limpando volumes órfãos..."
VOLUMES_BEFORE=$(docker volume ls -q 2>/dev/null | wc -l)
docker volume prune -f >> "$CLEANUP_LOG" 2>&1 || true
VOLUMES_AFTER=$(docker volume ls -q 2>/dev/null | wc -l)
VOLUMES_REMOVED=$((VOLUMES_BEFORE - VOLUMES_AFTER))
log "✅ $VOLUMES_REMOVED volumes órfãos removidos"

# 7. Limpar arquivos temporários do sistema
log ""
log "🗂️  Limpando arquivos temporários..."

# Limpar /tmp (arquivos mais antigos que 3 dias)
TMP_FILES=$(find /tmp -type f -atime +3 2>/dev/null | wc -l)
find /tmp -type f -atime +3 -delete 2>/dev/null || true
log "   $TMP_FILES arquivos temporários do sistema removidos"

# Limpar Next.js cache (se existir)
if [ -d "/var/www/hallyuhub/.next/cache" ]; then
    NEXT_CACHE=$(find /var/www/hallyuhub/.next/cache -type f -mtime +7 2>/dev/null | wc -l)
    find /var/www/hallyuhub/.next/cache -type f -mtime +7 -delete 2>/dev/null || true
    log "   $NEXT_CACHE arquivos de cache Next.js removidos"
fi

log "✅ Arquivos temporários limpos"

# 8. Limpar logs do sistema (journal - manter últimos 7 dias)
log ""
log "📰 Limpando logs do sistema (manter últimos 7 dias)..."
if command -v journalctl &> /dev/null; then
    JOURNAL_BEFORE=$(journalctl --disk-usage 2>/dev/null | grep -oE '[0-9.]+[KMGT]' | head -1 || echo "0B")
    journalctl --vacuum-time=7d >> "$CLEANUP_LOG" 2>&1 || true
    JOURNAL_AFTER=$(journalctl --disk-usage 2>/dev/null | grep -oE '[0-9.]+[KMGT]' | head -1 || echo "0B")
    log "✅ Logs do sistema limpos (antes: $JOURNAL_BEFORE → depois: $JOURNAL_AFTER)"
else
    log "⚠️  journalctl não disponível, pulando limpeza do journal"
fi

# 9. Truncar logs muito grandes (>100MB) mantendo últimas 10000 linhas
log ""
log "✂️  Truncando logs muito grandes (>100MB)..."
LARGE_LOGS=$(find /var/www/hallyuhub -name "*.log" -type f -size +100M 2>/dev/null | wc -l)
find /var/www/hallyuhub -name "*.log" -type f -size +100M 2>/dev/null | while read file; do
    log "   Truncando: $file"
    tail -10000 "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done || true
log "✅ $LARGE_LOGS logs grandes truncados"

# 10. Mostrar espaço DEPOIS da limpeza
log ""
show_disk_space "Espaço em disco DEPOIS da limpeza"

# 11. Calcular espaço economizado
DISK_USAGE=$(df /var/www/hallyuhub 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//' || df / | tail -1 | awk '{print $5}' | sed 's/%//')

# 12. Resumo
log ""
log "=========================================="
log "✅ Limpeza automática concluída!"
log "=========================================="
log "Resumo:"
log "  📝 Logs antigos: $LOGS_REMOVED removidos"
log "  🐳 Imagens Docker: $IMAGES_REMOVED removidas"
log "  📦 Containers: $CONTAINERS_REMOVED removidos"
log "  💾 Volumes órfãos: $VOLUMES_REMOVED removidos"
log "  🗂️  Logs grandes: $LARGE_LOGS truncados"
log "  💿 Uso de disco atual: ${DISK_USAGE}%"
log ""

# 13. Enviar notificação Slack se configurado
if [ -n "${SLACK_WEBHOOK_ALERTS:-}" ]; then
    # Determinar emoji e status baseado no uso de disco
    if [ "$DISK_USAGE" -gt 85 ]; then
        EMOJI="🔴"
        STATUS="CRÍTICO: Uso de disco em ${DISK_USAGE}%!"
    elif [ "$DISK_USAGE" -gt 75 ]; then
        EMOJI="⚠️"
        STATUS="Aviso: Uso de disco em ${DISK_USAGE}%"
    else
        EMOJI="✅"
        STATUS="Normal (${DISK_USAGE}%)"
    fi

    TOTAL_REMOVED=$((IMAGES_REMOVED + CONTAINERS_REMOVED + VOLUMES_REMOVED + LOGS_REMOVED))

    curl -X POST "$SLACK_WEBHOOK_ALERTS" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"${EMOJI} Limpeza Automática Concluída\",
            \"blocks\": [{
                \"type\": \"section\",
                \"text\": {
                    \"type\": \"mrkdwn\",
                    \"text\": \"*🧹 Limpeza Automática do Servidor*\n\n*Status do Disco:* ${STATUS}\n*Total removido:* ${TOTAL_REMOVED} itens\n  • Imagens Docker: ${IMAGES_REMOVED}\n  • Containers: ${CONTAINERS_REMOVED}\n  • Volumes: ${VOLUMES_REMOVED}\n  • Logs: ${LOGS_REMOVED}\n\n*Log completo:* \`$CLEANUP_LOG\`\"
                }
            }]
        }" >> "$CLEANUP_LOG" 2>&1 || log "⚠️  Falha ao enviar notificação Slack"
fi

log "🎉 Script finalizado com sucesso!"

# Retornar código de erro se disco estiver muito cheio (>90%)
if [ "$DISK_USAGE" -gt 90 ]; then
    log "❌ ALERTA: Disco muito cheio (${DISK_USAGE}%)!"
    exit 1
fi

exit 0
