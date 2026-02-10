#!/bin/bash
# ============================================================
# Instala modelo gemma:2b no Ollama Production
# Modelo mais leve e rápido que phi3
# ============================================================

set -e

echo "=========================================="
echo "  Installing gemma:2b in Production"
echo "=========================================="
echo ""

# Verificar se container existe
if ! docker ps | grep -q "hallyuhub-ollama-production"; then
    echo "❌ Container hallyuhub-ollama-production não encontrado"
    exit 1
fi

# Verificar se gemma:2b já está instalado
if docker exec hallyuhub-ollama-production ollama list | grep -q "gemma:2b"; then
    echo "✅ gemma:2b já está instalado"
    echo ""
    docker exec hallyuhub-ollama-production ollama list | grep gemma
    echo ""
    echo "Nada a fazer."
    exit 0
fi

echo "📥 Baixando e instalando gemma:2b..."
echo "   Isso pode demorar alguns minutos..."
echo ""

# Pull do modelo
docker exec hallyuhub-ollama-production ollama pull gemma:2b

echo ""
echo "✅ gemma:2b instalado com sucesso!"
echo ""

# Mostrar modelos instalados
echo "📊 Modelos instalados:"
docker exec hallyuhub-ollama-production ollama list

echo ""
echo "=========================================="
echo "  ✅ Instalação concluída!"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANTE: Atualize .env.production com:"
echo "   OLLAMA_MODEL=\"gemma:2b\""
echo ""
echo "Depois, reinicie o container da aplicação:"
echo "   docker-compose -f docker-compose.prod.yml restart hallyuhub"
echo ""
