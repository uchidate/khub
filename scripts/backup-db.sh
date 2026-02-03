#!/bin/bash
# ============================================================
# Script de Backup PostgreSQL - HallyuHub
# ============================================================
# Uso: bash backup-db.sh [--staging|--prod] [--keep N]
#
# Opcoes:
#   --staging   Backup do banco de staging (default: production)
#   --prod      Backup do banco de producao
#   --keep N    Manter apenas os ultimos N backups (default: 30)
#   --upload    Upload para Google Drive (requer gdrive configurado)
#
# O backup e salvo em: /var/www/hallyuhub/backups/[env]/
# Formato: backup-YYYYMMDD-HHMMSS.sql.gz
# ============================================================

set -e

# Configuracoes padrao
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_BACKUP_DIR="/var/www/hallyuhub/backups"
KEEP_BACKUPS=30
ENV_TYPE="production"
UPLOAD_GDRIVE=false

# Parse argumentos
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --staging) ENV_TYPE="staging" ;;
        --prod) ENV_TYPE="production" ;;
        --keep) KEEP_BACKUPS="$2"; shift ;;
        --upload) UPLOAD_GDRIVE=true ;;
        *) echo "Argumento desconhecido: $1"; exit 1 ;;
    esac
    shift
done

# Configuracao baseada no ambiente
if [ "$ENV_TYPE" = "production" ]; then
    CONTAINER_NAME="hallyuhub-postgres-production"
    DB_NAME="hallyuhub_production"
    BACKUP_DIR="${BASE_BACKUP_DIR}/production"
else
    CONTAINER_NAME="hallyuhub-postgres-staging"
    DB_NAME="hallyuhub_staging"
    BACKUP_DIR="${BASE_BACKUP_DIR}/staging"
fi

DB_USER="hallyuhub"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="backup-${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Funcao para log com timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Funcao para enviar notificacao Slack
notify_slack() {
    local status=$1
    local size=$2
    local retained=$3
    local error_msg=$4

    # Verifica se webhook esta configurado
    if [ -z "$SLACK_WEBHOOK_ALERTS" ]; then
        return 0
    fi

    local emoji="💾"
    local status_label="Concluido"
    local color="good"

    if [ "$status" = "failed" ]; then
        emoji="❌"
        status_label="Falhou"
        color="danger"
    fi

    local env_label="PRODUCAO"
    if [ "$ENV_TYPE" = "staging" ]; then
        env_label="STAGING"
    fi

    local payload=$(cat <<EOF
{
    "blocks": [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "${emoji} Backup ${env_label} - ${status_label}",
                "emoji": true
            }
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": "*Ambiente:*\n${env_label}"},
                {"type": "mrkdwn", "text": "*Status:*\n${status_label}"}
            ]
        }
EOF
)

    if [ -n "$size" ] && [ "$status" = "success" ]; then
        payload="${payload},
        {
            \"type\": \"section\",
            \"fields\": [
                {\"type\": \"mrkdwn\", \"text\": \"*Tamanho:*\n${size}\"},
                {\"type\": \"mrkdwn\", \"text\": \"*Backups Retidos:*\n${retained}\"}
            ]
        }"
    fi

    if [ -n "$error_msg" ]; then
        payload="${payload},
        {
            \"type\": \"section\",
            \"text\": {
                \"type\": \"mrkdwn\",
                \"text\": \"*Erro:*\n\`\`\`${error_msg}\`\`\`\"
            }
        }"
    fi

    payload="${payload}
    ],
    \"text\": \"Backup ${env_label} - ${status_label}\"
}"

    curl -s -X POST "$SLACK_WEBHOOK_ALERTS" \
        -H "Content-Type: application/json" \
        -d "$payload" > /dev/null 2>&1 || true
}

# Funcao para limpar backups antigos
cleanup_old_backups() {
    local dir=$1
    local keep=$2

    log "Verificando backups antigos em ${dir}..."

    # Conta quantos backups existem
    local count=$(ls -1 "${dir}"/backup-*.sql.gz 2>/dev/null | wc -l)

    if [ "$count" -gt "$keep" ]; then
        local to_delete=$((count - keep))
        log "Removendo ${to_delete} backup(s) antigo(s)..."

        ls -1t "${dir}"/backup-*.sql.gz | tail -n "$to_delete" | while read file; do
            log "  Removendo: $(basename "$file")"
            rm -f "$file"
        done
    else
        log "Backups dentro do limite (${count}/${keep})"
    fi
}

# ============================================================
# INICIO DO BACKUP
# ============================================================

echo "=========================================="
echo "  BACKUP PostgreSQL - HallyuHub"
echo "=========================================="
echo "  Ambiente:  ${ENV_TYPE}"
echo "  Container: ${CONTAINER_NAME}"
echo "  Database:  ${DB_NAME}"
echo "  Destino:   ${BACKUP_PATH}"
echo "  Retencao:  ${KEEP_BACKUPS} backups"
echo "=========================================="
echo ""

# Cria diretorio de backup se nao existir
mkdir -p "${BACKUP_DIR}"

# Verifica se o container esta rodando
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log "ERRO: Container ${CONTAINER_NAME} nao esta rodando!"
    notify_slack "failed" "" "" "Container ${CONTAINER_NAME} nao esta rodando"
    exit 1
fi

# Executa o backup usando pg_dump dentro do container
log "Iniciando backup do PostgreSQL..."
docker exec "${CONTAINER_NAME}" pg_dump \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=plain \
    --no-owner \
    --no-acl \
    | gzip > "${BACKUP_PATH}"

# Verifica se o backup foi criado com sucesso
if [ ! -f "${BACKUP_PATH}" ] || [ ! -s "${BACKUP_PATH}" ]; then
    log "ERRO: Falha ao criar backup!"
    notify_slack "failed" "" "" "Falha ao criar arquivo de backup"
    exit 1
fi

# Mostra informacoes do backup
BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
log "Backup criado com sucesso: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Limpa backups antigos
cleanup_old_backups "${BACKUP_DIR}" "${KEEP_BACKUPS}"

# Conta backups retidos
RETAINED_COUNT=$(ls -1 "${BACKUP_DIR}"/backup-*.sql.gz 2>/dev/null | wc -l | tr -d ' ')

# Upload para Google Drive (se habilitado e configurado)
if [ "$UPLOAD_GDRIVE" = true ]; then
    if [ -f "${SCRIPT_DIR}/google-drive-upload.sh" ]; then
        log "Fazendo upload para Google Drive..."
        bash "${SCRIPT_DIR}/google-drive-upload.sh" "${BACKUP_PATH}" || {
            log "AVISO: Falha no upload para Google Drive"
        }
    else
        log "AVISO: Script de upload do Google Drive nao encontrado"
    fi
fi

# Resumo final
echo ""
echo "=========================================="
echo "  BACKUP CONCLUIDO"
echo "=========================================="
echo "  Arquivo: ${BACKUP_FILE}"
echo "  Tamanho: ${BACKUP_SIZE}"
echo "  Local:   ${BACKUP_DIR}"
echo ""
echo "  Backups disponiveis:"
ls -lht "${BACKUP_DIR}"/backup-*.sql.gz 2>/dev/null | head -5 | awk '{print "    " $9 " (" $5 ")"}'
echo "=========================================="

log "Backup finalizado com sucesso!"

# Envia notificacao Slack de sucesso
notify_slack "success" "${BACKUP_SIZE}" "${RETAINED_COUNT}" ""
