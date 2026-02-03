#!/bin/bash
# test-docker-build.sh - Testa build do Dockerfile.alpine localmente

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         TESTE LOCAL - DOCKERFILE ALPINE                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd v1

echo "🔨 Construindo imagem Alpine..."
echo ""

docker build \
  -f Dockerfile.alpine \
  -t hallyuhub:alpine-test \
  --progress=plain \
  . 2>&1 | tee /tmp/docker-build.log

if [ $? -eq 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ BUILD SUCESSO!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "📊 Tamanho da imagem:"
  docker images hallyuhub:alpine-test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
  echo ""

  echo "🧪 Testando container..."
  docker run -d --name alpine-test \
    -p 3002:3000 \
    -e DATABASE_URL="file:/app/data/test.db" \
    -e NEXT_PUBLIC_SITE_URL="http://localhost:3002" \
    hallyuhub:alpine-test

  echo "Aguardando startup (30s)..."
  sleep 30

  echo ""
  echo "🔍 Verificando health..."
  if curl -f http://localhost:3002/api/health; then
    echo ""
    echo "✅ Health check OK!"
  else
    echo ""
    echo "❌ Health check falhou"
    echo ""
    echo "Logs do container:"
    docker logs alpine-test
  fi

  echo ""
  echo "🧹 Cleanup..."
  docker stop alpine-test
  docker rm alpine-test

else
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ BUILD FALHOU!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Logs salvos em: /tmp/docker-build.log"
  echo ""
  echo "Últimas 50 linhas do erro:"
  tail -50 /tmp/docker-build.log
fi
