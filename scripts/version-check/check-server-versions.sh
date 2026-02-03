#!/bin/bash
# check-server-versions.sh

# IMPORTANTE: Configure seu usuário SSH antes de usar
SSH_USER="${SSH_USER:-seu-usuario}"  # Pode ser configurado via variável de ambiente
SSH_HOST="31.97.255.107"

echo "=== VERIFICANDO VERSÕES NO SERVIDOR ==="
echo ""

# Verifica se a conexão SSH está configurada
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 ${SSH_USER}@${SSH_HOST} exit 2>/dev/null; then
    echo "❌ Erro: Não foi possível conectar via SSH"
    echo "   Configure sua chave SSH primeiro ou verifique suas credenciais"
    echo ""
    echo "   Passos para configurar SSH:"
    echo "   1. ssh-keygen -t ed25519 -C 'seu-email@example.com'"
    echo "   2. ssh-copy-id ${SSH_USER}@${SSH_HOST}"
    echo ""
    echo "   Ou configure a variável SSH_USER:"
    echo "   export SSH_USER=seu-usuario-real"
    echo "   ./check-server-versions.sh"
    exit 1
fi

echo "✅ Conexão SSH OK"
echo ""

# Verifica containers Docker rodando
echo "📦 Containers Docker em execução:"
ssh ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAME|hallyuhub"
ENDSSH
echo ""

# Verifica imagens Docker disponíveis
echo "🖼️  Imagens Docker disponíveis:"
ssh ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
    docker images | grep -E "REPOSITORY|khub"
ENDSSH
echo ""

# Verifica último deploy
echo "📅 Último deploy (baseado em timestamp dos containers):"
ssh ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
    docker ps --format "{{.Names}}: Criado {{.CreatedAt}}" | grep hallyuhub
ENDSSH
echo ""

# Verifica logs recentes
echo "📋 Últimas 10 linhas de log (produção):"
ssh ${SSH_USER}@${SSH_HOST} << 'ENDSSH'
    docker logs hallyuhub --tail 10 2>&1 || echo "Container 'hallyuhub' não encontrado"
ENDSSH
echo ""
