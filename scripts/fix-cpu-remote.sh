#!/bin/bash
# Script para diagnosticar e corrigir CPU alta no servidor
# Execute localmente: ./scripts/fix-cpu-remote.sh

SERVER="root@31.97.255.107"

echo "🔍 Conectando ao servidor..."
echo ""

# Função de diagnóstico
diagnose() {
    ssh $SERVER << 'ENDSSH'
echo "═══════════════════════════════════════"
echo "  DIAGNÓSTICO CPU - HallyuHub"
echo "═══════════════════════════════════════"
echo ""

echo "📊 1. USO DE CPU GERAL:"
top -b -n 1 | head -15
echo ""

echo "🐳 2. CONTAINERS RODANDO:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""

echo "📈 3. CPU POR CONTAINER:"
docker stats --no-stream
echo ""

echo "═══════════════════════════════════════"
ENDSSH
}

# Função de correção
fix_staging() {
    echo ""
    echo "🛠️  APLICANDO CORREÇÃO: Parar Staging"
    echo ""

    ssh $SERVER << 'ENDSSH'
cd /var/www/hallyuhub

echo "🛑 Parando staging..."
docker-compose -f docker-compose.staging.yml stop

echo ""
echo "⏳ Aguardando 10 segundos..."
sleep 10

echo ""
echo "📊 CPU APÓS PARAR STAGING:"
docker stats --no-stream
echo ""

echo "✅ Staging parado com sucesso!"
ENDSSH
}

# Função de aplicar limites
apply_limits() {
    echo ""
    echo "🛠️  APLICANDO CORREÇÃO: Novos Limites de CPU"
    echo ""

    ssh $SERVER << 'ENDSSH'
cd /var/www/hallyuhub

echo "📥 Atualizando código..."
git fetch origin
git pull origin main

echo ""
echo "🔄 Recriando containers com novos limites..."
docker-compose -f docker-compose.prod.yml up -d --force-recreate

echo ""
echo "⏳ Aguardando containers subirem (20s)..."
sleep 20

echo ""
echo "📊 RESULTADO FINAL:"
docker stats --no-stream
echo ""

echo "✅ Limites aplicados com sucesso!"
ENDSSH
}

# Menu principal
echo "Escolha uma ação:"
echo "1) Diagnóstico (apenas ver status)"
echo "2) Parar Staging (economiza ~40% CPU)"
echo "3) Aplicar novos limites de CPU"
echo "4) Tudo (diagnóstico + parar staging + limites)"
echo ""
read -p "Opção [1-4]: " option

case $option in
    1)
        diagnose
        ;;
    2)
        diagnose
        fix_staging
        ;;
    3)
        diagnose
        apply_limits
        ;;
    4)
        diagnose
        fix_staging
        sleep 5
        apply_limits
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "✅ Processo concluído!"
echo ""
