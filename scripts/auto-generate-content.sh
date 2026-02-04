#!/bin/bash
# ============================================================
# Auto Generate Content - HallyuHub
# ============================================================
# Script executado pelo cron para gerar conteúdo automaticamente
# Executa a cada 15 minutos
# ============================================================

set -e

# Diretório do projeto (ajustar conforme ambiente)
PROJECT_DIR="${PROJECT_DIR:-/var/www/hallyuhub}"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/auto-generate-$(date +%Y-%m).log"

# Criar diretório de logs se não existir
mkdir -p "${LOG_DIR}"

# Função para log com timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Início da execução
log "=========================================="
log "Iniciando geração automática de conteúdo"
log "=========================================="

# Navegar para o diretório do projeto
cd "${PROJECT_DIR}"

# Carregar variáveis de ambiente (prioridade: .env.production > .env.staging > .env)
ENV_FILE=""
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
    log "Carregando .env.production"
elif [ -f ".env.staging" ]; then
    ENV_FILE=".env.staging"
    log "Carregando .env.staging"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
    log "Carregando .env"
fi

if [ -n "$ENV_FILE" ]; then
    export $(cat "$ENV_FILE" | grep -v '^#' | grep -v '^\s*$' | xargs)
else
    log "AVISO: Nenhum arquivo .env encontrado"
fi

# Verificar se algum provider de AI está configurado
if [ -z "$GEMINI_API_KEY" ] && [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$OLLAMA_BASE_URL" ]; then
    log "ERRO: Nenhum provider de AI configurado!"
    log "Configure pelo menos uma das variáveis: GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, OLLAMA_BASE_URL"
    exit 1
fi

# Executar script de atualização
log "Executando atualize-ai.ts..."

# Verificar se está rodando em ambiente com Docker e se o container existe
CONTAINER_NAME="hallyuhub"
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    # Executar dentro do container Docker
    log "Executando via Docker container (${CONTAINER_NAME})..."
    # Usamos npx tsx diretamente para garantir, mas npm run deve funcionar com o package.json copiado
    docker exec "${CONTAINER_NAME}" npm run atualize:ai -- --news=0 --artists=1 --productions=0 >> "${LOG_FILE}" 2>&1
    EXIT_CODE=$?
elif docker ps --format '{{.Names}}' | grep -q "^hallyuhub-production$"; then
    # Fallback para nome alternativo
    CONTAINER_NAME="hallyuhub-production"
    log "Executando via Docker container (${CONTAINER_NAME})..."
    docker exec "${CONTAINER_NAME}" npm run atualize:ai -- --news=0 --artists=1 --productions=0 >> "${LOG_FILE}" 2>&1
    EXIT_CODE=$?
else
    # Fallback: Executar localmente (ambiente de desenvolvimento ou container não encontrado)
    if command -v npm &> /dev/null; then
        log "Container Docker não encontrado. Executando via npm local..."
        npm run atualize:ai -- --news=0 --artists=1 --productions=0 >> "${LOG_FILE}" 2>&1
        EXIT_CODE=$?
    else
        log "ERRO: Docker e npm não encontrados ou container '${CONTAINER_NAME}' offline."
        EXIT_CODE=1
    fi
fi

if [ $EXIT_CODE -eq 0 ]; then
    log "✅ Geração concluída com sucesso"
else
    log "❌ Erro na geração (exit code: $EXIT_CODE)"
fi

log "=========================================="
log ""

exit $EXIT_CODE
