#!/bin/bash
# ============================================================
# Script para Limpar e Reconfigurar o Crontab
# Remove duplicatas e reconfigura corretamente
# ============================================================

set -e

echo "=========================================="
echo "  FIX CRONTAB - HallyuHub"
echo "=========================================="
echo ""

# Detectar ambiente
if [ -n "$NODE_ENV" ]; then
    ENV="$NODE_ENV"
else
    # Detectar pelo PATH do projeto
    if [ -d "/var/www/hallyuhub" ]; then
        ENV="production"
    else
        ENV="development"
    fi
fi

PROJECT_DIR="/var/www/hallyuhub"

echo "🔍 Ambiente detectado: $ENV"
echo "📂 Diretório: $PROJECT_DIR"
echo ""

# Mostrar crontab atual
echo "📋 Crontab atual (com duplicatas):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
crontab -l 2>/dev/null || echo "(vazio)"
echo ""

# Confirmar limpeza
echo "⚠️  Este script vai:"
echo "  1. REMOVER completamente o crontab atual"
echo "  2. Reconfigurar do zero com as entradas corretas"
echo ""

read -p "Deseja continuar? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo "🧹 Limpando crontab..."

# Remover crontab completamente
crontab -r 2>/dev/null || true

echo "✅ Crontab limpo!"
echo ""

# Reconfigurar usando o setup existente
echo "⚙️  Reconfigurando crontab..."

if [ "$ENV" = "production" ]; then
    # Production setup
    # Nota: watchdog está em /etc/cron.d/hallyuhub-watchdog (não aqui)
    # Nota: AI generation foi desativado (hallyuhub-ai cron.d removido)
    (echo "# HallyuHub - Production Crontab Configuration"; \
     echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"; \
     echo ""; \
     echo "# Health Monitor every 30 minutes"; \
     echo "*/30 * * * * ${PROJECT_DIR}/scripts/monitor-health.sh >> ${PROJECT_DIR}/logs/health-monitor.log 2>&1"; \
     echo ""; \
     echo "# Email Digest Jobs"; \
     echo "0 9 * * * ${PROJECT_DIR}/scripts/cron/daily-digest.sh >> ${PROJECT_DIR}/logs/cron/daily-digest.log 2>&1"; \
     echo "0 9 * * 1 ${PROJECT_DIR}/scripts/cron/weekly-digest.sh >> ${PROJECT_DIR}/logs/cron/weekly-digest.log 2>&1"; \
     echo ""; \
     echo "# Server Cleanup daily at 3AM"; \
     echo "0 3 * * * SLACK_WEBHOOK_ALERTS=\${SLACK_WEBHOOK_ALERTS} ${PROJECT_DIR}/scripts/cleanup-cron.sh >> ${PROJECT_DIR}/logs/cleanup-cron.log 2>&1") | crontab -
else
    # Staging setup
    (echo "# HallyuHub - Staging Crontab Configuration"; \
     echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"; \
     echo ""; \
     echo "# Staging content generation every 15 minutes"; \
     echo "*/15 * * * * ${PROJECT_DIR}/scripts/staging-cron.sh >> ${PROJECT_DIR}/logs/staging-cron.log 2>&1"; \
     echo ""; \
     echo "# Health Monitor every 30 minutes"; \
     echo "*/30 * * * * ${PROJECT_DIR}/scripts/monitor-health.sh >> ${PROJECT_DIR}/logs/health-monitor.log 2>&1"; \
     echo ""; \
     echo "# Server Cleanup daily at 3AM"; \
     echo "0 3 * * * SLACK_WEBHOOK_ALERTS=\${SLACK_WEBHOOK_ALERTS} ${PROJECT_DIR}/scripts/cleanup-cron.sh >> ${PROJECT_DIR}/logs/cleanup-cron.log 2>&1"; \
     echo ""; \
     echo "# Auto sleep staging at midnight to save CPU"; \
     echo "0 0 * * * ${PROJECT_DIR}/scripts/manage-staging.sh sleep >> ${PROJECT_DIR}/logs/staging-management.log 2>&1") | crontab -
fi

echo "✅ Crontab reconfigurado!"
echo ""

# Mostrar novo crontab
echo "📋 Novo crontab (limpo e organizado):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
crontab -l
echo ""

echo "=========================================="
echo "  ✅ CRONTAB CORRIGIDO COM SUCESSO!"
echo "=========================================="
echo ""
echo "📊 Cron jobs configurados:"
if [ "$ENV" = "production" ]; then
    echo "  • Auto-generate (*/15 * * * *) - A cada 15 minutos"
else
    echo "  • Staging generation (*/15 * * * *) - A cada 15 minutos"
    echo "  • Ollama sleep (0 0 * * *) - Meia-noite"
fi
echo "  • Health Monitor (*/30 * * * *) - A cada 30 minutos"
echo "  • Server Cleanup (0 3 * * *) - Diariamente às 3h"
echo ""
echo "📝 Logs em: ${PROJECT_DIR}/logs/"
echo ""
