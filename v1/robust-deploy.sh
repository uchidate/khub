#!/bin/bash
# Script de Deploy Robusto - HallyuHub
# Este script deve rodar DENTRO do servidor em /var/www/hallyuhub

set -e

IMAGE_NAME="hallyuhub_proc"
PULL_MODE=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --pull) IMAGE_NAME="$2"; PULL_MODE=true; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Carrega variáveis do .env se existir
if [ -f "${SCRIPT_DIR}/.env" ]; then
  export $(grep -v '^#' "${SCRIPT_DIR}/.env" | grep '=' | xargs)
fi

echo "🚀 Iniciando deploy robusto..."

# 0. Backup automático antes de qualquer alteração
echo "💾 Criando backup do banco antes do deploy..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bash "${SCRIPT_DIR}/scripts/backup-db.sh"
echo "💾 Backup concluído. Seguindo com o deploy..."

# 1. Limpar containers antigos
echo "🧹 Limpando ambiente..."
docker rm -f hallyuhub 2>/dev/null || true

if [ "$PULL_MODE" = true ]; then
  echo "📥 Baixando imagem remota: $IMAGE_NAME"
  docker pull "$IMAGE_NAME"
else
  echo "🔨 Construindo imagem local..."
  docker builder prune -f 2>/dev/null || true
  docker build -t hallyuhub_proc .
fi

# 2. Rodar o container
echo "🏃 Iniciando container..."
docker run -d \
  --name hallyuhub \
  --restart always \
  --network web \
  --add-host=host.docker.internal:host-gateway \
  -p 3000:3000 \
  -v hallyuhub-data:/app/data \
  -e DATABASE_URL="file:/app/data/prod.db" \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e OLLAMA_BASE_URL="http://host.docker.internal:11434" \
  -e GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  -e ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
  -e UNSPLASH_ACCESS_KEY="${UNSPLASH_ACCESS_KEY:-}" \
  -e GOOGLE_CUSTOM_SEARCH_KEY="${GOOGLE_CUSTOM_SEARCH_KEY:-}" \
  -e GOOGLE_CX="${GOOGLE_CX:-}" \
  -e TMDB_API_KEY="${TMDB_API_KEY:-}" \
  "$IMAGE_NAME"

echo "✅ Deploy concluído! Verificando logs..."
sleep 5
docker logs hallyuhub
