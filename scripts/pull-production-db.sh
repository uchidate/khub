#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# pull-production-db.sh
#
# Copia o banco de produção para o banco local de desenvolvimento.
# APENAS para uso em desenvolvimento — NÃO rodar em produção.
#
# Uso:
#   ./scripts/pull-production-db.sh
#   ./scripts/pull-production-db.sh --skip-confirm   (sem prompt)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
PROD_HOST="31.97.255.107"
PROD_USER="root"
PROD_APP_IMAGE="ghcr.io/uchidate/khub:latest"
PROD_APP_CONTAINER="${PROD_APP_CONTAINER:-}"
PROD_CONTAINER="${PROD_CONTAINER:-}"
PROD_DB="${PROD_DB:-}"
PROD_DB_USER="${PROD_DB_USER:-}"
PROD_DB_PASS="${PROD_DB_PASS:-}"

LOCAL_CONTAINER="hallyuhub-postgres-dev"
LOCAL_DB="hallyuhub_dev"
LOCAL_DB_USER="hallyuhub"
LOCAL_DB_PASS="dev_password_change_in_prod"

DUMP_FILE="${DUMP_FILE:-/tmp/hallyuhub_prod_latest.dump}"

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --skip-confirm) SKIP_CONFIRM=true ;;
    *) echo "Argumento desconhecido: $1"; exit 1 ;;
  esac
  shift
done

# ── Cores ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  📦 HallyuHub — Pull Production DB → Local           ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Origem:  ${RED}${PROD_HOST}${NC} (produção)"
echo -e "  Destino: ${GREEN}localhost/${LOCAL_DB}${NC} (local)"
echo ""
echo -e "${YELLOW}  ⚠️  O banco local será APAGADO e recriado com os dados de produção.${NC}"
echo ""

# ── Confirmação ──────────────────────────────────────────────────────────────
if [[ "${SKIP_CONFIRM:-false}" != true ]]; then
  read -rp "  Confirmar? (s/N) " confirm
  [[ "$confirm" =~ ^[sS]$ ]] || { echo "Cancelado."; exit 0; }
  echo ""
fi

# ── Resolver banco de produção pelo DATABASE_URL do app ─────────────────────
echo -e "${CYAN}[0/4] Descobrindo banco de produção...${NC}"
if [[ -z "${PROD_APP_CONTAINER}" ]]; then
  PROD_APP_CONTAINER=$(ssh "${PROD_USER}@${PROD_HOST}" \
    "docker ps --filter ancestor=${PROD_APP_IMAGE} --format '{{.Names}}' | head -1")
fi

if [[ -z "${PROD_APP_CONTAINER}" ]]; then
  echo -e "      ${RED}✗ Container do app de produção não encontrado (${PROD_APP_IMAGE})${NC}"
  exit 1
fi

PROD_DATABASE_URL=$(ssh "${PROD_USER}@${PROD_HOST}" \
  "docker inspect ${PROD_APP_CONTAINER} --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^DATABASE_URL=' | cut -d= -f2-")

if [[ -z "${PROD_DATABASE_URL}" ]]; then
  echo -e "      ${RED}✗ DATABASE_URL não encontrada em ${PROD_APP_CONTAINER}${NC}"
  exit 1
fi

PROD_DB_CONFIG=$(node -e '
const url = new URL(process.argv[1])
console.log([
  url.hostname,
  url.pathname.replace(/^\//, ""),
  decodeURIComponent(url.username),
  decodeURIComponent(url.password),
].join("\t"))
' "${PROD_DATABASE_URL}")
IFS=$'\t' read -r PROD_DB_HOST PROD_DB_NAME PROD_DB_USER_FROM_URL PROD_DB_PASS_FROM_URL <<< "${PROD_DB_CONFIG}"

PROD_CONTAINER="${PROD_CONTAINER:-${PROD_DB_HOST}}"
PROD_DB="${PROD_DB:-${PROD_DB_NAME}}"
PROD_DB_USER="${PROD_DB_USER:-${PROD_DB_USER_FROM_URL}}"
PROD_DB_PASS="${PROD_DB_PASS:-${PROD_DB_PASS_FROM_URL}}"

echo -e "      ${GREEN}✓ App: ${PROD_APP_CONTAINER}${NC}"
echo -e "      ${GREEN}✓ Banco: ${PROD_CONTAINER}/${PROD_DB}${NC}"

# ── 1. Dump no servidor de produção ─────────────────────────────────────────
echo -e "${CYAN}[1/4] Gerando dump em produção...${NC}"
PG_DUMP_OPTIONS="-U ${PROD_DB_USER} -Fc -Z9 --no-acl --no-owner ${PROD_DB}"
ssh "${PROD_USER}@${PROD_HOST}" \
  "PGPASSWORD='${PROD_DB_PASS}' docker exec ${PROD_CONTAINER} \
   pg_dump ${PG_DUMP_OPTIONS} \
   > /tmp/hallyuhub_dump.dump"
echo -e "      ${GREEN}✓ Dump gerado${NC}"

# ── 2. Copiar dump para local ────────────────────────────────────────────────
echo -e "${CYAN}[2/4] Copiando dump para local...${NC}"
rsync -av --partial --progress \
  -e "ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=4" \
  "${PROD_USER}@${PROD_HOST}:/tmp/hallyuhub_dump.dump" "${DUMP_FILE}"
ssh "${PROD_USER}@${PROD_HOST}" "rm -f /tmp/hallyuhub_dump.dump" &
DUMP_SIZE=$(du -sh "${DUMP_FILE}" | cut -f1)
echo -e "      ${GREEN}✓ ${DUMP_SIZE} copiados → ${DUMP_FILE}${NC}"

# ── 3. Recriar banco local ───────────────────────────────────────────────────
echo -e "${CYAN}[3/4] Recriando banco local...${NC}"
docker exec -e PGPASSWORD="${LOCAL_DB_PASS}" "${LOCAL_CONTAINER}" \
  psql -U "${LOCAL_DB_USER}" -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${LOCAL_DB}' AND pid <> pg_backend_pid();" \
  > /dev/null 2>&1 || true

docker exec -e PGPASSWORD="${LOCAL_DB_PASS}" "${LOCAL_CONTAINER}" \
  psql -U "${LOCAL_DB_USER}" -d postgres \
  -c "DROP DATABASE IF EXISTS ${LOCAL_DB};" \
  > /dev/null

docker exec -e PGPASSWORD="${LOCAL_DB_PASS}" "${LOCAL_CONTAINER}" \
  psql -U "${LOCAL_DB_USER}" -d postgres \
  -c "CREATE DATABASE ${LOCAL_DB};" \
  > /dev/null
echo -e "      ${GREEN}✓ Banco local recriado${NC}"

# ── 4. Restaurar dump ────────────────────────────────────────────────────────
echo -e "${CYAN}[4/4] Restaurando dados...${NC}"
docker cp "${DUMP_FILE}" "${LOCAL_CONTAINER}:/tmp/restore.dump"
docker exec -e PGPASSWORD="${LOCAL_DB_PASS}" "${LOCAL_CONTAINER}" \
  pg_restore -U "${LOCAL_DB_USER}" -d "${LOCAL_DB}" \
  --no-acl --no-owner --no-privileges \
  -j 4 /tmp/restore.dump 2>/dev/null || true

docker exec "${LOCAL_CONTAINER}" rm -f /tmp/restore.dump
rm -f "${DUMP_FILE}"
echo -e "      ${GREEN}✓ Restaurado${NC}"

# ── Finalizado ───────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Concluído! Banco local atualizado com dados de produção.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}Próximo passo:${NC} npm run dev → http://localhost:3000"
echo ""
