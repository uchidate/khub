#!/bin/bash
# Backup do banco SQLite do HallyuHub
# Uso: bash backup-db.sh [volume_name] [backup_dir] [max_backups]
#
# Funciona sem o container principal estar rodando — monta o volume
# diretamente via container Alpine temporário em modo somente leitura.

set -e

VOLUME_NAME="${1:-hallyuhub-data}"
BACKUP_DIR="${2:-/var/www/hallyuhub/backups}"
MAX_BACKUPS="${3:-7}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="backup-${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup do banco de dados..."
echo "[$(date)] Volume: ${VOLUME_NAME} | Destino: ${BACKUP_DIR}/${BACKUP_FILE}"

# Copia o banco via container temporário (sem dependência do container principal)
docker run --rm \
  -v "${VOLUME_NAME}:/data:ro" \
  -v "${BACKUP_DIR}:/backups" \
  alpine \
  cp /data/prod.db "/backups/${BACKUP_FILE}"

if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
  echo "[$(date)] ERRO: Arquivo de backup não foi criado." >&2
  exit 1
fi

SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup criado com sucesso: ${BACKUP_FILE} (${SIZE})"

# Rotação: mantém apenas os últimos MAX_BACKUPS backups
TOTAL=$(ls -t "${BACKUP_DIR}"/backup-*.db 2>/dev/null | wc -l)
if [ "$TOTAL" -gt "$MAX_BACKUPS" ]; then
  echo "[$(date)] Rotacionando backups (mantém últimos ${MAX_BACKUPS} de ${TOTAL})..."
  ls -t "${BACKUP_DIR}"/backup-*.db | tail -n +"$((MAX_BACKUPS + 1))" | while read -r old_backup; do
    echo "[$(date)] Removendo: $(basename "$old_backup")"
    rm "$old_backup"
  done
fi

echo "[$(date)] Backups disponíveis:"
ls -lt "${BACKUP_DIR}"/backup-*.db 2>/dev/null | awk '{print $6, $7, $8, $9}'
