#!/bin/bash
# check-production-version.sh

echo "=== VERSÃO EM PRODUÇÃO ==="
echo ""
echo "🌐 URL: http://31.97.255.107:3000"
echo ""

# Verifica se o endpoint de health está respondendo
echo "📊 Health check:"
curl -s http://31.97.255.107:3000/api/health | jq . 2>/dev/null || echo "Endpoint não disponível ou sem jq instalado"
echo ""

# Versão esperada (branch main)
echo "🌿 Branch esperada: main"
echo ""
echo "📝 Último commit em main:"
git log main -1 --oneline
echo ""

# Se tiver acesso SSH configurado
echo "🔍 Para verificar a imagem Docker em produção:"
echo "   ssh [seu-usuario]@31.97.255.107 'docker ps | grep hallyuhub'"
