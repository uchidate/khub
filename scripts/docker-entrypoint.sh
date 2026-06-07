#!/bin/sh
# ============================================================
# Docker Entrypoint — HallyuHub
# ============================================================
# Roda prisma migrate deploy antes de iniciar o servidor.
# Garante que o schema do banco esteja sempre sincronizado
# com a versão da aplicação em cada deploy.
# ============================================================

set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy
echo "[entrypoint] Migrations OK"

# Limpa o Data Cache (fetch-cache) gerado em runtime.
# Sem isso, requisições de cold-start (pool de conexões ainda aquecendo)
# podem retornar resultados vazios que ficam cacheados pelo `revalidate`
# da rota e persistem até o TTL expirar — afetando hubs e outras páginas
# com queries dinâmicas logo após cada novo deploy.
echo "[entrypoint] Clearing stale fetch-cache..."
rm -rf .next/cache/fetch-cache/* 2>/dev/null || true

echo "[entrypoint] Starting server..."
exec node server.js
