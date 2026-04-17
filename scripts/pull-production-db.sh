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
PROD_CONTAINER="hallyuhub-postgres-production"
PROD_DB="hallyuhub_production"
PROD_DB_USER="hallyuhub"
PROD_DB_PASS="HallyuHub2026ProdXda4c0851799bd8f2"

LOCAL_CONTAINER="hallyuhub-postgres-dev"
LOCAL_DB="hallyuhub_dev"
LOCAL_DB_USER="hallyuhub"
LOCAL_DB_PASS="dev_password_change_in_prod"

DUMP_FILE="/tmp/hallyuhub_prod_$(date +%Y%m%d_%H%M%S).dump"

# ── Cores ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  📦 HallyuHub — Pull Production DB → Local           ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Origem:  ${RED}${PROD_HOST}/${PROD_DB}${NC} (produção)"
echo -e "  Destino: ${GREEN}localhost/${LOCAL_DB}${NC} (local)"
echo ""
echo -e "${YELLOW}  ⚠️  O banco local será APAGADO e recriado com os dados de produção.${NC}"
echo ""

# ── Confirmação ──────────────────────────────────────────────────────────────
if [[ "${1:-}" != "--skip-confirm" ]]; then
  read -rp "  Confirmar? (s/N) " confirm
  [[ "$confirm" =~ ^[sS]$ ]] || { echo "Cancelado."; exit 0; }
  echo ""
fi

# ── 1. Dump no servidor de produção ─────────────────────────────────────────
echo -e "${CYAN}[1/4] Gerando dump em produção...${NC}"
ssh "${PROD_USER}@${PROD_HOST}" \
  "PGPASSWORD='${PROD_DB_PASS}' docker exec ${PROD_CONTAINER} \
   pg_dump -U ${PROD_DB_USER} -Fc --no-acl --no-owner ${PROD_DB} \
   > /tmp/hallyuhub_dump.dump"
echo -e "      ${GREEN}✓ Dump gerado${NC}"

# ── 2. Copiar dump para local ────────────────────────────────────────────────
echo -e "${CYAN}[2/4] Copiando dump para local...${NC}"
scp -q "${PROD_USER}@${PROD_HOST}:/tmp/hallyuhub_dump.dump" "${DUMP_FILE}"
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
