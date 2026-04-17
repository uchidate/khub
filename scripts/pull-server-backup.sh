#!/usr/bin/env bash
# ============================================================
# pull-server-backup.sh
# Faz backup completo do servidor para máquina local.
# Necessário antes de formatar/reinstalar o servidor.
#
# Uso: ./scripts/pull-server-backup.sh [--skip-db]
#   --skip-db  pula o dump do banco (só baixa configs/certs/código)
#
# O backup é salvo em: ~/hallyuhub-server-backup/YYYY-MM-DD_HHMM/
# ============================================================
set -euo pipefail

SERVER="root@31.97.255.107"
REMOTE_DIR="/var/www/hallyuhub"
DATE=$(date +%Y-%m-%d_%H%M)
BACKUP_DIR="$HOME/hallyuhub-server-backup/$DATE"
SKIP_DB=false

for arg in "$@"; do
    [[ "$arg" == "--skip-db" ]] && SKIP_DB=true
done

echo "════════════════════════════════════════════════"
echo "  HallyuHub — Backup completo do servidor"
echo "  Destino: $BACKUP_DIR"
echo "════════════════════════════════════════════════"
echo ""

mkdir -p "$BACKUP_DIR"

# ── 1. /var/www/hallyuhub completo ──────────────────────────
echo "📁 [1/5] Copiando /var/www/hallyuhub (código, configs, logs, backups)..."
rsync -az --progress \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='.next/' \
    "$SERVER:$REMOTE_DIR/" \
    "$BACKUP_DIR/hallyuhub/"
echo "  ✓ /var/www/hallyuhub/"

# ── 2. Certificados SSL (Let's Encrypt) ──────────────────────
echo ""
echo "🔒 [2/5] Copiando certificados SSL..."
rsync -az \
    "$SERVER:/etc/letsencrypt/" \
    "$BACKUP_DIR/letsencrypt/"
echo "  ✓ /etc/letsencrypt/"

# ── 3. Configs do nginx ──────────────────────────────────────
echo ""
echo "🌐 [3/5] Copiando configs do nginx..."
rsync -az \
    "$SERVER:/etc/nginx/" \
    "$BACKUP_DIR/nginx/"
echo "  ✓ /etc/nginx/"

# ── 4. Cron jobs ─────────────────────────────────────────────
echo ""
echo "⏰ [4/5] Copiando cron jobs..."
rsync -az \
    "$SERVER:/etc/cron.d/" \
    "$BACKUP_DIR/cron.d/"
echo "  ✓ /etc/cron.d/"

# ── 5. Banco de dados ────────────────────────────────────────
if [[ "$SKIP_DB" == "true" ]]; then
    echo ""
    echo "⏭️  [5/5] Banco pulado (--skip-db)"
else
    echo ""
    echo "🗄️  [5/5] Fazendo dump fresco do banco de produção..."
    mkdir -p "$BACKUP_DIR/db"

    DUMP_FILE="hallyuhub_production_$DATE.sql.gz"

    ssh "$SERVER" bash << ENDSSH
        docker exec hallyuhub-postgres-production pg_dump \
            -U hallyuhub \
            -d hallyuhub_production \
            --no-owner --no-acl \
            | gzip > /tmp/$DUMP_FILE
        echo "Dump gerado: /tmp/$DUMP_FILE ($(du -sh /tmp/$DUMP_FILE | cut -f1))"
ENDSSH

    scp "$SERVER:/tmp/$DUMP_FILE" "$BACKUP_DIR/db/"
    ssh "$SERVER" "rm -f /tmp/$DUMP_FILE"
    echo "  ✓ Dump fresco: $DUMP_FILE"

    # Backup diário mais recente
    echo "  📥 Baixando todos os backups diários..."
    rsync -az --progress \
        "$SERVER:$REMOTE_DIR/backups/production/" \
        "$BACKUP_DIR/db/daily-backups/"
    echo "  ✓ Backups diários copiados"
fi

# ── Resumo ───────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "✅ Backup concluído!"
echo ""
echo "📁 Local: $BACKUP_DIR"
echo ""
echo "Tamanhos:"
du -sh "$BACKUP_DIR"/*/  2>/dev/null | sort -rh
echo ""
echo "⚠️  Para reinstalar o servidor:"
echo "   1. hallyuhub/       → .env.production + .env.staging já estão aqui"
echo "   2. letsencrypt/     → copiar para /etc/letsencrypt/ antes do certbot"
echo "   3. nginx/           → copiar para /etc/nginx/ após instalar nginx"
echo "   4. cron.d/          → copiar hallyuhub-* para /etc/cron.d/"
echo "   5. db/              → restaurar com pg_restore após setup do Postgres"
echo "════════════════════════════════════════════════"
