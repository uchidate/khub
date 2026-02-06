#!/bin/bash
# ============================================================
# Auto Generate Content - HallyuHub
# ============================================================
# Script executado pelo cron para gerar conteúdo automaticamente
# Executa a cada 5 minutos
# ============================================================

set -e

# Diretório do projeto (auto-detectar baseado na localização do script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/auto-generate-$(date +%Y-%m).log"

# Criar diretório de logs se não existir
mkdir -p "${LOG_DIR}"

# Busca exaustiva por binários (cron tem PATH limitado)
find_bin() {
    local name=$1
    local common_paths=("/usr/local/bin/$name" "/usr/bin/$name" "/bin/$name" "/usr/sbin/$name")
    for path in "${common_paths[@]}"; do
        if [ -x "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    command -v "$name" || echo "$name"
}

DOCKER_BIN=$(find_bin docker)
NPM_BIN=$(find_bin npm)

# Detectar se usa 'docker compose' (v2) ou 'docker-compose' (v1)
if $DOCKER_BIN compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="$DOCKER_BIN compose"
else
    DOCKER_COMPOSE=$(find_bin docker-compose)
fi

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

# Carregar variáveis de ambiente
ENV_FILE=""
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
elif [ -f ".env.staging" ]; then
    ENV_FILE=".env.staging"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ -n "$ENV_FILE" ]; then
    log "Carregando $ENV_FILE"
    # Carregar variáveis ignorando comentários e lidando com espaços
    while IFS= read -r line || [[ -n "$line" ]]; do
        if [[ ! "$line" =~ ^# ]] && [[ -n "$line" ]]; then
            export "$line"
        fi
    done < "$ENV_FILE"
else
    log "AVISO: Nenhum arquivo .env encontrado"
fi

# Executar script de atualização
log "Executando atualize-ai.ts..."

# Verificar se algum container está rodando
CONTAINER_NAME="hallyuhub"
if $DOCKER_BIN ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log "Executando via Docker container (${CONTAINER_NAME})..."
    $DOCKER_BIN exec \
        -e GEMINI_API_KEY="$GEMINI_API_KEY" \
        -e OPENAI_API_KEY="$OPENAI_API_KEY" \
        -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
        -e TMDB_API_KEY="$TMDB_API_KEY" \
        -e GOOGLE_SEARCH_API_KEY="$GOOGLE_SEARCH_API_KEY" \
        -e GOOGLE_CX="$GOOGLE_CX" \
        -e OLLAMA_BASE_URL="$OLLAMA_BASE_URL" \
        -e SLACK_WEBHOOK_CONTENT="$SLACK_WEBHOOK_CONTENT" \
        -e SLACK_WEBHOOK_DEPLOYS="$SLACK_WEBHOOK_DEPLOYS" \
        -e SLACK_WEBHOOK_ALERTS="$SLACK_WEBHOOK_ALERTS" \
        -e DATABASE_URL="$DATABASE_URL" \
        "${CONTAINER_NAME}" npm run atualize:ai -- --news=0 --artists=1 --productions=0 --refresh-discography=true --refresh-filmography=true >> "${LOG_FILE}" 2>&1
    EXIT_CODE=$?
elif $DOCKER_BIN ps --format '{{.Names}}' | grep -q "^hallyuhub-production$"; then
    CONTAINER_NAME="hallyuhub-production"
    log "Executando via Docker container (${CONTAINER_NAME})..."
    $DOCKER_BIN exec \
        -e GEMINI_API_KEY="$GEMINI_API_KEY" \
        -e OPENAI_API_KEY="$OPENAI_API_KEY" \
        -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
        -e TMDB_API_KEY="$TMDB_API_KEY" \
        -e GOOGLE_SEARCH_API_KEY="$GOOGLE_SEARCH_API_KEY" \
        -e GOOGLE_CX="$GOOGLE_CX" \
        -e OLLAMA_BASE_URL="$OLLAMA_BASE_URL" \
        -e SLACK_WEBHOOK_CONTENT="$SLACK_WEBHOOK_CONTENT" \
        -e SLACK_WEBHOOK_DEPLOYS="$SLACK_WEBHOOK_DEPLOYS" \
        -e SLACK_WEBHOOK_ALERTS="$SLACK_WEBHOOK_ALERTS" \
        -e DATABASE_URL="$DATABASE_URL" \
        "${CONTAINER_NAME}" npm run atualize:ai -- --news=0 --artists=1 --productions=0 --refresh-discography=true --refresh-filmography=true >> "${LOG_FILE}" 2>&1
    EXIT_CODE=$?
else
    if [ -x "$NPM_BIN" ]; then
        log "Container Docker não encontrado. Executando via npm local ($NPM_BIN)..."
        "$NPM_BIN" run atualize:ai -- --news=0 --artists=1 --productions=0 >> "${LOG_FILE}" 2>&1
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
