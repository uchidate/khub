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

echo "🚀 Iniciando deploy robusto..."

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
  -p 3000:3000 \
  -v hallyuhub-data:/app/data \
  -e DATABASE_URL="file:/app/data/prod.db" \
  -e NEXT_TELEMETRY_DISABLED=1 \
  "$IMAGE_NAME"

echo "✅ Deploy concluído! Verificando logs..."
sleep 5
docker logs hallyuhub
