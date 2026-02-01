#!/bin/bash

# Script para instalar e configurar Ollama no servidor Hostinger
# Este script deve ser executado como root

echo "🚀 Instalando Ollama..."

# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verificar instalação
if ! command -v ollama &> /dev/null; then
    echo "❌ Erro: Ollama não foi instalado corretamente"
    exit 1
fi

echo "✅ Ollama instalado com sucesso"

# Iniciar serviço Ollama
echo "🔧 Iniciando serviço Ollama..."
systemctl enable ollama
systemctl start ollama

# Aguardar o serviço iniciar
sleep 5

# Baixar modelo padrão (llama3:8b)
echo "📥 Baixando modelo llama3:8b (isso pode levar alguns minutos)..."
ollama pull llama3:8b

# Verificar se o modelo foi baixado
if ollama list | grep -q "llama3:8b"; then
    echo "✅ Modelo llama3:8b baixado com sucesso"
else
    echo "❌ Erro ao baixar modelo llama3:8b"
    exit 1
fi

# Testar o modelo
echo "🧪 Testando modelo..."
ollama run llama3:8b "Say hello in one word" --verbose=false

echo ""
echo "✨ Instalação completa!"
echo ""
echo "📋 Modelos disponíveis:"
ollama list
echo ""
echo "🔗 Ollama está rodando em: http://localhost:11434"
echo "💡 Para usar no HallyuHub, execute: npm run atualize:ai -- --provider=ollama"
