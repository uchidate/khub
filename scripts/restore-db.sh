#!/bin/bash
# ============================================================
# Script de Restauracao PostgreSQL - HallyuHub
# ============================================================
# Uso: bash restore-db.sh [--staging|--prod] [arquivo_backup]
#
# Se nenhum arquivo for especificado, usa o backup mais recente.
#
# Opcoes:
#   --staging   Restaurar no banco de staging
#   --prod      Restaurar no banco de producao (default)
#   --force     Pular confirmacao (CUIDADO!)
#
# Exemplo:
#   bash restore-db.sh --prod backup-20260203-030000.sql.gz
#   bash restore-db.sh --staging  # usa backup mais recente
# ============================================================

set -e

# Configuracoes padrao
BASE_BACKUP_DIR="/var/www/hallyuhub/backups"
ENV_TYPE="production"
FORCE_RESTORE=false
BACKUP_FILE=""

# Parse argumentos
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --staging) ENV_TYPE="staging" ;;
        --prod) ENV_TYPE="production" ;;
        --force) FORCE_RESTORE=true ;;
        *)
            # Se nao e uma flag, assume que e o arquivo de backup
            if [[ ! "$1" =~ ^-- ]]; then
                BACKUP_FILE="$1"
            fi
            ;;
    esac
    shift
done

# Configuracao baseada no ambiente
if [ "$ENV_TYPE" = "production" ]; then
    CONTAINER_NAME="hallyuhub-postgres-production"
    APP_CONTAINER="hallyuhub"
    DB_NAME="hallyuhub_production"
    BACKUP_DIR="${BASE_BACKUP_DIR}/production"
else
    CONTAINER_NAME="hallyuhub-postgres-staging"
    APP_CONTAINER="hallyuhub-staging"
    DB_NAME="hallyuhub_staging"
    BACKUP_DIR="${BASE_BACKUP_DIR}/staging"
fi

DB_USER="hallyuhub"

# Funcao para log com timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# ============================================================
# VALIDACOES
# ============================================================

# Se nenhum arquivo especificado, usa o mais recente
if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE=$(ls -1t "${BACKUP_DIR}"/backup-*.sql.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo "ERRO: Nenhum backup encontrado em ${BACKUP_DIR}"
        exit 1
    fi
else
    # Se o arquivo nao tem caminho completo, adiciona o diretorio
    if [[ ! "$BACKUP_FILE" =~ ^/ ]]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    fi
fi

# Valida existencia do arquivo
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERRO: Arquivo de backup nao encontrado: ${BACKUP_FILE}"
    echo ""
    echo "Backups disponiveis em ${BACKUP_DIR}:"
    ls -lht "${BACKUP_DIR}"/backup-*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ", " $6 " " $7 ")"}' || echo "  (nenhum)"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
BACKUP_NAME=$(basename "$BACKUP_FILE")

# ============================================================
# CONFIRMACAO
# ============================================================

echo ""
echo "=========================================="
echo "  RESTAURACAO PostgreSQL - HallyuHub"
echo "=========================================="
echo "  Ambiente:  ${ENV_TYPE}"
echo "  Container: ${CONTAINER_NAME}"
echo "  Database:  ${DB_NAME}"
echo "  Backup:    ${BACKUP_NAME} (${BACKUP_SIZE})"
echo "=========================================="
echo ""
echo "  ATENCAO: Esta operacao vai SUBSTITUIR todo o banco atual!"
echo "  A aplicacao sera temporariamente parada durante a restauracao."
echo ""

if [ "$FORCE_RESTORE" != true ]; then
    read -r -p "  Digite 'RESTAURAR' para confirmar: " confirmation
    if [ "$confirmation" != "RESTAURAR" ]; then
        log "Restauracao cancelada pelo usuario."
        exit 0
    fi
fi

echo ""

# ============================================================
# RESTAURACAO
# ============================================================

# 1. Parar a aplicacao (para evitar conexoes ativas)
log "Parando aplicacao ${APP_CONTAINER}..."
docker stop "${APP_CONTAINER}" 2>/dev/null || true

# 2. Aguardar conexoes fecharem
sleep 2

# 3. Dropar e recriar o banco
log "Recriando banco de dados ${DB_NAME}..."
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
" 2>/dev/null || true

docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};"

# 4. Restaurar o backup
log "Restaurando backup ${BACKUP_NAME}..."
gunzip -c "$BACKUP_FILE" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" --quiet

# 5. Reiniciar a aplicacao
log "Reiniciando aplicacao ${APP_CONTAINER}..."
docker start "${APP_CONTAINER}"

# 6. Aguardar aplicacao subir
log "Aguardando aplicacao iniciar..."
sleep 5

# ============================================================
# VERIFICACAO
# ============================================================

echo ""
echo "=========================================="
echo "  RESTAURACAO CONCLUIDA"
echo "=========================================="

# Verificar status do container
if docker ps --format '{{.Names}}' | grep -q "^${APP_CONTAINER}$"; then
    log "Aplicacao rodando normalmente"

    # Mostrar algumas estatisticas do banco
    echo ""
    echo "  Estatisticas do banco restaurado:"
    docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "
        SELECT
            (SELECT COUNT(*) FROM \"Artist\") as artistas,
            (SELECT COUNT(*) FROM \"Production\") as producoes,
            (SELECT COUNT(*) FROM \"News\") as noticias;
    " 2>/dev/null || echo "  (nao foi possivel obter estatisticas)"
else
    log "AVISO: Aplicacao pode nao ter iniciado corretamente"
    docker logs --tail=10 "${APP_CONTAINER}" 2>/dev/null || true
fi

echo ""
log "Restauracao finalizada!"
