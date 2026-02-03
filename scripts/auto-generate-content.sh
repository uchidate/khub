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

# Carregar variáveis de ambiente
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | grep -v '^\s*$' | xargs)
fi

# Verificar se algum provider de AI está configurado
if [ -z "$GEMINI_API_KEY" ] && [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$OLLAMA_BASE_URL" ]; then
    log "ERRO: Nenhum provider de AI configurado!"
    log "Configure pelo menos uma das variáveis: GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, OLLAMA_BASE_URL"
    exit 1
fi

# Executar script de atualização
log "Executando atualize-ai.ts..."

# Gerar 1 notícia e 1 artista por execução (evita sobrecarga)
npm run atualize:ai -- --news 1 --artists 1 >> "${LOG_FILE}" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    log "✅ Geração concluída com sucesso"
else
    log "❌ Erro na geração (exit code: $EXIT_CODE)"
fi

log "=========================================="
log ""

exit $EXIT_CODE
