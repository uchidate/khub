#!/bin/bash
# ============================================================
# Script de Instalacao e Configuracao do Ollama - HallyuHub
# ============================================================
# Uso: bash setup-ollama.sh [--model MODEL]
#
# Opcoes:
#   --model MODEL   Modelo a instalar (default: phi3)
#   --check         Apenas verificar se Ollama esta funcionando
#   --uninstall     Remover Ollama
#
# Modelos recomendados:
#   phi3      - Leve e rapido (~2GB RAM)
#   mistral   - Equilibrado (~4GB RAM)
#   llama3:8b - Mais capaz (~8GB RAM)
# ============================================================

set -e

MODEL="phi3"
CHECK_ONLY=false
UNINSTALL=false
OLLAMA_URL="http://localhost:11434"

# Parse argumentos
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --model) MODEL="$2"; shift ;;
        --check) CHECK_ONLY=true ;;
        --uninstall) UNINSTALL=true ;;
        *) echo "Argumento desconhecido: $1"; exit 1 ;;
    esac
    shift
done

# Funcao para log com timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Funcao para verificar se Ollama esta rodando
check_ollama() {
    if curl -s "${OLLAMA_URL}/api/tags" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Funcao para verificar modelos instalados
list_models() {
    curl -s "${OLLAMA_URL}/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "(nenhum)"
}

# ============================================================
# APENAS VERIFICAR
# ============================================================
if [ "$CHECK_ONLY" = true ]; then
    echo "=========================================="
    echo "  VERIFICACAO DO OLLAMA"
    echo "=========================================="

    if check_ollama; then
        log "Ollama esta rodando em ${OLLAMA_URL}"
        echo ""
        echo "  Modelos instalados:"
        list_models | while read model; do
            echo "    - $model"
        done
        echo ""

        # Testar geracao
        log "Testando geracao..."
        RESPONSE=$(curl -s "${OLLAMA_URL}/api/generate" \
            -d '{"model":"'"${MODEL}"'","prompt":"Diga oi","stream":false}' \
            2>/dev/null | grep -o '"response":"[^"]*"' | head -1 || echo "")

        if [ -n "$RESPONSE" ]; then
            log "Geracao OK com modelo ${MODEL}"
        else
            log "AVISO: Modelo ${MODEL} pode nao estar instalado"
        fi
    else
        log "ERRO: Ollama nao esta rodando"
        exit 1
    fi
    exit 0
fi

# ============================================================
# DESINSTALAR
# ============================================================
if [ "$UNINSTALL" = true ]; then
    echo "=========================================="
    echo "  DESINSTALANDO OLLAMA"
    echo "=========================================="

    log "Parando servico Ollama..."
    sudo systemctl stop ollama 2>/dev/null || true
    sudo systemctl disable ollama 2>/dev/null || true

    log "Removendo binario..."
    sudo rm -f /usr/local/bin/ollama

    log "Removendo modelos..."
    rm -rf ~/.ollama

    log "Ollama removido com sucesso"
    exit 0
fi

# ============================================================
# INSTALACAO
# ============================================================

echo "=========================================="
echo "  INSTALACAO DO OLLAMA - HallyuHub"
echo "=========================================="
echo "  Modelo: ${MODEL}"
echo "  URL:    ${OLLAMA_URL}"
echo "=========================================="
echo ""

# Verificar se ja esta instalado
if command -v ollama &> /dev/null; then
    log "Ollama ja esta instalado"
    ollama --version
else
    log "Instalando Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Verificar se o servico esta rodando
if ! check_ollama; then
    log "Iniciando servico Ollama..."

    # Tentar iniciar via systemd
    if systemctl is-enabled ollama &> /dev/null 2>&1; then
        sudo systemctl start ollama
    else
        # Iniciar manualmente em background
        nohup ollama serve > /tmp/ollama.log 2>&1 &
        sleep 3
    fi
fi

# Verificar novamente
if ! check_ollama; then
    log "ERRO: Nao foi possivel iniciar Ollama"
    exit 1
fi

log "Ollama rodando em ${OLLAMA_URL}"

# Baixar modelo
log "Baixando modelo ${MODEL}..."
ollama pull "${MODEL}"

# Testar o modelo
log "Testando modelo ${MODEL}..."
RESPONSE=$(curl -s "${OLLAMA_URL}/api/generate" \
    -d '{"model":"'"${MODEL}"'","prompt":"Responda apenas: OK","stream":false}' \
    2>/dev/null)

if echo "$RESPONSE" | grep -q "response"; then
    log "Modelo ${MODEL} funcionando corretamente"
else
    log "AVISO: Teste do modelo falhou"
fi

# ============================================================
# CONFIGURAR AMBIENTE
# ============================================================

ENV_FILE="/var/www/hallyuhub/.env.production"

if [ -f "$ENV_FILE" ]; then
    if grep -q "OLLAMA_BASE_URL" "$ENV_FILE"; then
        log "OLLAMA_BASE_URL ja configurado em ${ENV_FILE}"
    else
        log "Adicionando OLLAMA_BASE_URL a ${ENV_FILE}..."
        echo "" >> "$ENV_FILE"
        echo "# Ollama (Local AI)" >> "$ENV_FILE"
        echo "OLLAMA_BASE_URL=${OLLAMA_URL}" >> "$ENV_FILE"
    fi
else
    log "AVISO: ${ENV_FILE} nao encontrado"
    log "Adicione manualmente: OLLAMA_BASE_URL=${OLLAMA_URL}"
fi

# ============================================================
# RESUMO
# ============================================================

echo ""
echo "=========================================="
echo "  INSTALACAO CONCLUIDA"
echo "=========================================="
echo "  Ollama URL:  ${OLLAMA_URL}"
echo "  Modelo:      ${MODEL}"
echo ""
echo "  Modelos instalados:"
list_models | while read model; do
    echo "    - $model"
done
echo ""
echo "  Proximo passo:"
echo "    Reinicie o container HallyuHub para usar Ollama:"
echo "    cd /var/www/hallyuhub && docker-compose -f docker-compose.prod.yml restart hallyuhub"
echo "=========================================="

log "Setup completo!"
