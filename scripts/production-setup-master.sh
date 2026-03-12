#!/bin/bash
# ============================================================
# Script Master de Setup de Produção - HallyuHub
# ============================================================
# Este script automatiza TODOS os passos de configuração
# ============================================================

set -e

echo "=========================================="
echo "  HALLYUHUB - SETUP DE PRODUÇÃO"
echo "=========================================="
echo ""
echo "Este script vai configurar:"
echo "  1. Volumes Docker"
echo "  2. Ollama (IA local)"
echo "  3. Nginx + HTTPS"
echo "  4. Auto-geração de conteúdo"
echo ""
read -p "Continuar? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Abortado pelo usuário"
    exit 1
fi

# Verificar se está em produção
if [[ ! -f "/var/www/hallyuhub/docker-compose.prod.yml" ]]; then
    echo "ERRO: Este script deve ser executado em /var/www/hallyuhub"
    exit 1
fi

cd /var/www/hallyuhub

echo ""
echo "=========================================="
echo "  1/6 - ATUALIZANDO CÓDIGO"
echo "=========================================="
git pull origin main

echo ""
echo "=========================================="
echo "  2/6 - CRIANDO VOLUMES DOCKER"
echo "=========================================="

# Criar volumes se não existirem
for volume in ollama-production-data postgres-production-data hallyuhub-data; do
    if ! docker volume inspect $volume &> /dev/null; then
        echo "Criando volume: $volume"
        docker volume create $volume
    else
        echo "Volume já existe: $volume"
    fi
done

echo ""
echo "=========================================="
echo "  3/6 - SUBINDO CONTAINERS"
echo "=========================================="

docker-compose -f docker-compose.prod.yml up -d

# Aguardar containers iniciarem
echo "Aguardando containers iniciarem..."
sleep 10

# Verificar containers
echo ""
echo "Containers rodando:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=========================================="
echo "  4/6 - CONFIGURANDO OLLAMA"
echo "=========================================="

if docker ps | grep -q "hallyuhub-ollama-production"; then
    echo "Container Ollama encontrado, configurando..."

    # Verificar se modelo já está instalado
    if docker exec hallyuhub-ollama-production ollama list 2>/dev/null | grep -q "phi3"; then
        echo "Modelo phi3 já instalado"
    else
        echo "Baixando modelo phi3 (~2.2GB)..."
        echo "Isso pode levar alguns minutos..."
        docker exec hallyuhub-ollama-production ollama pull phi3
    fi

    # Testar
    echo "Testando Ollama..."
    ./scripts/test-ollama.sh production || echo "⚠️  Teste do Ollama falhou, mas continuando..."
else
    echo "⚠️  Container Ollama não encontrado"
fi

echo ""
echo "=========================================="
echo "  5/6 - VERIFICANDO HTTPS"
echo "=========================================="

if command -v nginx &> /dev/null; then
    echo "✅ Nginx já instalado"

    if sudo certbot certificates 2>/dev/null | grep -q "hallyuhub.com.br"; then
        echo "✅ Certificado SSL já configurado"
    else
        echo "⚠️  Certificado SSL não encontrado"
        echo "Execute manualmente: sudo ./scripts/setup-nginx-https.sh"
    fi
else
    echo "⚠️  Nginx não instalado"
    echo ""
    echo "Para configurar HTTPS, execute:"
    echo "  sudo ./scripts/setup-nginx-https.sh"
    echo ""
    echo "Configurações:"
    echo "  Domínio: hallyuhub.com.br"
    echo "  Incluir www: y"
    echo "  Porta: 3000"
fi

echo ""
echo "=========================================="
echo "  VERIFICAÇÕES FINAIS"
echo "=========================================="
echo ""

# Verificar containers
echo "📦 Containers:"
if docker ps | grep -q "hallyuhub"; then
    echo "  ✅ hallyuhub (aplicação)"
else
    echo "  ❌ hallyuhub NÃO está rodando"
fi

if docker ps | grep -q "postgres-production"; then
    echo "  ✅ hallyuhub-postgres-production"
else
    echo "  ❌ PostgreSQL NÃO está rodando"
fi

if docker ps | grep -q "ollama-production"; then
    echo "  ✅ hallyuhub-ollama-production"
else
    echo "  ❌ Ollama NÃO está rodando"
fi

echo ""

# Verificar aplicação
echo "🌐 Aplicação:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "  ✅ Respondendo em http://localhost:3000"
else
    echo "  ❌ NÃO está respondendo"
fi

# Verificar HTTPS
if curl -s -k https://localhost > /dev/null 2>&1; then
    echo "  ✅ HTTPS configurado"
else
    echo "  ⚠️  HTTPS não configurado (execute setup-nginx-https.sh)"
fi

echo ""

# Verificar cron
echo ""
echo "=========================================="
echo "  SETUP CONCLUÍDO!"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo ""

if ! command -v nginx &> /dev/null || ! sudo certbot certificates 2>/dev/null | grep -q "hallyuhub.com.br"; then
    echo "1. Configurar HTTPS:"
    echo "   sudo ./scripts/setup-nginx-https.sh"
    echo ""
    echo "2. Atualizar .env.production:"
    echo "   NEXT_PUBLIC_SITE_URL=https://www.hallyuhub.com.br"
    echo ""
    echo "3. Reiniciar aplicação:"
    echo "   docker-compose -f docker-compose.prod.yml restart hallyuhub"
    echo ""
fi

echo "4. Testar no navegador:"
echo "   https://www.hallyuhub.com.br"
echo ""
echo "5. Verificar health:"
echo "   curl https://www.hallyuhub.com.br/api/health | jq ."
echo ""
echo "6. Ver logs:"
echo "   docker logs hallyuhub -f --tail 50"
echo ""
echo "=========================================="
