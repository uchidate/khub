#!/bin/bash
# safe-migrate.sh
#
# Executa prisma migrate deploy de forma robusta:
# 1. Detecta e resolve migrações travadas (failed + sem rolled_back_at)
# 2. Aplica as migrações pendentes
# 3. Sempre sai com 0 para não bloquear o deploy (erros críticos vão para os logs)
#
# Uma migração "travada" é aquela que falhou (sem finished_at) e não foi
# rolled-back — geralmente causada por DDL que já existia no banco (ex: coluna
# criada manualmente antes da migração rodar).

set -euo pipefail

log() { echo "[safe-migrate] $*"; }

# Resolve migrações travadas automaticamente
# Usa o DATABASE_URL para consultar _prisma_migrations via psql (disponível na imagem)
resolve_stuck() {
  log "🔍 Verificando migrações travadas..."

  # psql pode não estar disponível; usa o Prisma CLI para inspecionar
  STUCK=$(npx prisma migrate status 2>&1 | grep "Following migration" -A 100 \
    | grep "•" | grep -v "applied\|rolled back" | awk '{print $2}' || true)

  if [ -z "$STUCK" ]; then
    log "✅ Nenhuma migração travada detectada"
    return
  fi

  log "⚠️  Migrações travadas: $STUCK"
  for migration in $STUCK; do
    log "  → Resolvendo como --applied: $migration"
    npx prisma migrate resolve --applied "$migration" 2>/dev/null || true
  done
}

# Abordagem alternativa: consulta direta via DATABASE_URL se psql disponível
resolve_stuck_via_db() {
  if ! command -v psql &>/dev/null; then
    return
  fi

  STUCK=$(psql "$DATABASE_URL" -t -A -c \
    "SELECT migration_name FROM \"_prisma_migrations\" WHERE finished_at IS NULL AND rolled_back_at IS NULL;" \
    2>/dev/null || true)

  if [ -z "$STUCK" ]; then
    log "✅ Nenhuma migração travada no banco"
    return
  fi

  log "⚠️  Migrações travadas no banco: $(echo $STUCK | tr '\n' ' ')"
  while IFS= read -r migration; do
    [ -z "$migration" ] && continue
    log "  → Resolvendo como --applied: $migration"
    npx prisma migrate resolve --applied "$migration" 2>/dev/null || true
  done <<< "$STUCK"
}

main() {
  log "=== safe-migrate start ==="

  # Tenta resolver via banco primeiro (mais confiável), fallback para migrate status
  resolve_stuck_via_db || resolve_stuck

  log "🚀 Rodando prisma migrate deploy..."
  if npx prisma migrate deploy; then
    log "✅ migrate deploy concluído com sucesso"
  else
    log "⚠️  migrate deploy falhou — continuando com schema atual (erro nos logs acima)"
  fi

  log "=== safe-migrate done ==="
}

main
