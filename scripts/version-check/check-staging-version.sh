#!/bin/bash
# check-staging-version.sh

echo "=== VERSÃO EM STAGING ==="
echo ""
echo "🌐 URL: http://31.97.255.107:3001"
echo ""

# Verifica se o endpoint de health está respondendo
echo "📊 Health check:"
curl -s http://31.97.255.107:3001/api/health | jq . 2>/dev/null || echo "Endpoint não disponível ou sem jq instalado"
echo ""

# Versão esperada (branch develop)
echo "🌿 Branch esperada: develop"
echo ""
echo "📝 Último commit em develop:"
git log develop -1 --oneline
echo ""

# Se tiver acesso SSH configurado
echo "🔍 Para verificar a imagem Docker em staging:"
echo "   ssh [seu-usuario]@31.97.255.107 'docker ps | grep hallyuhub'"
