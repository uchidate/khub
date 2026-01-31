#!/bin/bash
# Script de Deploy Robusto - HallyuHub
# Este script deve rodar DENTRO do servidor em /var/www/hallyuhub

set -e

echo "🚀 Iniciando deploy robusto..."

# 1. Limpar containers antigos e imagens orfãs
echo "🧹 Limpando ambiente..."
docker rm -f hallyuhub 2>/dev/null || true
docker builder prune -f 2>/dev/null || true

# 2. Build da imagem (Usando cache se possível, mas forçando o Dockerfile novo)
echo "🔨 Construindo imagem Docker..."
docker build -t hallyuhub_proc .

# 3. Rodar o container manual (Pula bugs do docker-compose antigo)
echo "🏃 Iniciando container..."
docker run -d \
  --name hallyuhub \
  --restart always \
  --network web \
  -p 3000:3000 \
  -v hallyuhub-data:/app/data \
  -e DATABASE_URL="file:/app/data/prod.db" \
  -e NEXT_TELEMETRY_DISABLED=1 \
  hallyuhub_proc

echo "✅ Deploy concluído! Verificando logs..."
sleep 5
docker logs hallyuhub
