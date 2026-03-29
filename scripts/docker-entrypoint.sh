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

echo "[entrypoint] Starting server..."
exec node server.js
