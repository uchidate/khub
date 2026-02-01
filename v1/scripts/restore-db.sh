#!/bin/bash
# Restaura o banco SQLite do HallyuHub a partir de um backup
# Uso: bash restore-db.sh [nome_do_arquivo_backup]
#
# Se nenhum argumento for passado, restaura o backup mais recente.
# Exemplo: bash restore-db.sh backup-20260201-030000.db

set -e

VOLUME_NAME="hallyuhub-data"
CONTAINER_NAME="hallyuhub"
BACKUP_DIR="/var/www/hallyuhub/backups"

# Determina qual backup usar
if [ -n "$1" ]; then
  BACKUP_FILE="$1"
else
  BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/backup-*.db 2>/dev/null | head -1 | xargs basename 2>/dev/null)
fi

# Valida existência do backup
if [ -z "$BACKUP_FILE" ] || [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
  echo "ERRO: Backup não encontrado: ${BACKUP_FILE:-<nenhum>}" >&2
  echo ""
  echo "Backups disponíveis:"
  ls -lt "${BACKUP_DIR}"/backup-*.db 2>/dev/null | awk '{print $6, $7, $8, $9}' || echo "  (nenhum)"
  exit 1
fi

SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "========================================="
echo "  Restauração do banco de dados"
echo "========================================="
echo "  Backup:    ${BACKUP_FILE} (${SIZE})"
echo "  Container: ${CONTAINER_NAME}"
echo "  Volume:    ${VOLUME_NAME}"
echo "========================================="
echo ""
echo "  ATENÇÃO: isso vai substituir o banco atual."
echo "  Pressione Ctrl+C para cancelar."
echo ""
read -r -p "  Confirme digitando 'sim': " confirmation

if [ "$confirmation" != "sim" ]; then
  echo "Restauração cancelada."
  exit 0
fi

echo ""
echo "[$(date)] Para o container ${CONTAINER_NAME}..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true

echo "[$(date)] Restaurando backup via container temporário..."
docker run --rm \
  -v "${VOLUME_NAME}:/data" \
  -v "${BACKUP_DIR}:/backups" \
  alpine \
  cp "/backups/${BACKUP_FILE}" /data/prod.db

echo "[$(date)] Backup restaurado com sucesso."

echo "[$(date)] Reiniciando container..."
docker start "$CONTAINER_NAME"

echo ""
echo "[$(date)] Restauração concluída. Aguardando container subir..."
sleep 3
docker logs --tail=5 "$CONTAINER_NAME"
