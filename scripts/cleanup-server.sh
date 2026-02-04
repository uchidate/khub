#!/bin/bash

# Script de Diagnóstico e Limpeza do Servidor HallyuHub
# Usage: ./scripts/cleanup-server.sh [diagnose|clean|deep-clean]

set -e

MODE="${1:-diagnose}"
SERVER_PATH="/var/www/hallyuhub"

echo "================================================"
echo "  HallyuHub Server Cleanup & Diagnostic Tool"
echo "================================================"
echo ""

# Function to show sizes
show_sizes() {
    echo "📊 ANÁLISE DE ESPAÇO EM DISCO:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    echo "🔍 Tamanho total do projeto:"
    du -sh $SERVER_PATH 2>/dev/null || echo "Erro ao verificar tamanho"
    echo ""

    echo "🔍 Top 15 diretórios por tamanho:"
    du -sh $SERVER_PATH/* 2>/dev/null | sort -hr | head -15
    echo ""

    echo "🔍 Imagens Docker:"
    docker images | grep hallyuhub || echo "Nenhuma imagem hallyuhub encontrada"
    echo ""

    echo "🔍 Containers Docker (todos):"
    docker ps -a --filter "name=hallyuhub" --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"
    echo ""

    echo "🔍 Volumes Docker:"
    docker volume ls | grep hallyuhub || echo "Nenhum volume hallyuhub encontrado"
    echo ""

    echo "🔍 Espaço em disco geral:"
    df -h | grep -E '(Filesystem|/$|/var)'
    echo ""

    echo "🔍 Arquivos grandes (>100MB) no projeto:"
    find $SERVER_PATH -type f -size +100M 2>/dev/null | while read file; do
        size=$(du -sh "$file" | cut -f1)
        echo "  $size - $file"
    done || echo "  Nenhum arquivo >100MB encontrado"
    echo ""

    echo "🔍 Logs grandes (>10MB):"
    find $SERVER_PATH -name "*.log" -type f -size +10M 2>/dev/null | while read file; do
        size=$(du -sh "$file" | cut -f1)
        echo "  $size - $file"
    done || echo "  Nenhum log >10MB encontrado"
    echo ""
}

# Function to clean safely
clean_safe() {
    echo "🧹 LIMPEZA SEGURA (apenas itens temporários):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Remove old Docker images (keep last 3)
    echo "🗑️  Removendo imagens Docker antigas (mantendo últimas 3)..."
    docker images ghcr.io/uchidate/khub --format "{{.ID}} {{.CreatedAt}}" | \
        tail -n +4 | awk '{print $1}' | xargs -r docker rmi -f 2>/dev/null || \
        echo "Nenhuma imagem antiga para remover"

    # Remove stopped containers
    echo "🗑️  Removendo containers parados..."
    docker container prune -f

    # Remove dangling images
    echo "🗑️  Removendo imagens dangling..."
    docker image prune -f

    # Remove unused volumes
    echo "🗑️  Removendo volumes não utilizados..."
    docker volume prune -f

    # Clean npm cache inside containers (if needed)
    echo "🗑️  Limpando cache npm..."
    docker exec hallyuhub npm cache clean --force 2>/dev/null || \
        docker exec hallyuhub-staging npm cache clean --force 2>/dev/null || \
        echo "Containers não estão rodando"

    # Truncate large logs (keep last 1000 lines)
    echo "🗑️  Truncando logs grandes..."
    find $SERVER_PATH -name "*.log" -type f -size +50M 2>/dev/null | while read file; do
        echo "  Truncando: $file"
        tail -1000 "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    done

    echo ""
    echo "✅ Limpeza segura concluída!"
    echo ""
}

# Function to deep clean (more aggressive)
deep_clean() {
    echo "⚠️  LIMPEZA PROFUNDA (cuidado!):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    read -p "⚠️  Isso vai remover TODOS os containers e imagens. Continuar? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Cancelado."
        exit 0
    fi

    # Stop all hallyuhub containers
    echo "🛑 Parando containers..."
    docker stop $(docker ps -q --filter "name=hallyuhub") 2>/dev/null || echo "Nenhum container rodando"

    # Remove all hallyuhub containers
    echo "🗑️  Removendo containers..."
    docker rm $(docker ps -aq --filter "name=hallyuhub") 2>/dev/null || echo "Nenhum container para remover"

    # Remove all hallyuhub images
    echo "🗑️  Removendo imagens..."
    docker rmi $(docker images -q ghcr.io/uchidate/khub) -f 2>/dev/null || echo "Nenhuma imagem para remover"

    # System prune
    echo "🗑️  Limpeza completa do Docker..."
    docker system prune -af --volumes

    # Remove old backups (keep last 5)
    if [ -d "$SERVER_PATH/backups" ]; then
        echo "🗑️  Limpando backups antigos (mantendo últimos 5)..."
        cd $SERVER_PATH/backups
        ls -t *.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
    fi

    # Clean all logs
    echo "🗑️  Limpando todos os logs..."
    find $SERVER_PATH -name "*.log" -type f -exec truncate -s 0 {} \; 2>/dev/null

    echo ""
    echo "✅ Limpeza profunda concluída!"
    echo "⚠️  IMPORTANTE: Faça um novo deploy para recriar os containers!"
    echo ""
}

# Main logic
case $MODE in
    diagnose)
        show_sizes
        echo ""
        echo "💡 RECOMENDAÇÕES:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  • Execute './scripts/cleanup-server.sh clean' para limpeza segura"
        echo "  • Execute './scripts/cleanup-server.sh deep-clean' para limpeza profunda (cuidado!)"
        echo "  • Configure log rotation no servidor"
        echo "  • Considere limpar imagens Docker antigas regularmente"
        ;;
    clean)
        show_sizes
        echo ""
        clean_safe
        echo ""
        show_sizes
        ;;
    deep-clean)
        show_sizes
        echo ""
        deep_clean
        ;;
    *)
        echo "❌ Modo inválido: $MODE"
        echo "Usage: $0 [diagnose|clean|deep-clean]"
        exit 1
        ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Concluído!"
