#!/bin/bash
# ============================================================
# Script para exportar informações dos cron jobs para JSON
# Uso: ./export-cron-info.sh [production|staging]
# ============================================================

set -e

ENV=${1:-production}
OUTPUT_FILE="/var/www/hallyuhub/cron-config-${ENV}.json"

echo "📝 Exportando informações dos cron jobs para ${ENV}..."

# Criar array JSON
echo "[" > "$OUTPUT_FILE"

# Contador para vírgulas
FIRST=true

# Ler crontab e processar cada linha relevante
crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$" | while IFS= read -r line; do
  # Extrair schedule (primeiros 5 campos)
  SCHEDULE=$(echo "$line" | awk '{print $1" "$2" "$3" "$4" "$5}')
  # Extrair comando (resto da linha)
  COMMAND=$(echo "$line" | cut -d' ' -f6-)

  # Determinar nome e descrição baseado no comando
  NAME=""
  DESC=""
  FREQ=""

  if [[ "$COMMAND" == *"staging-cron"* ]]; then
    NAME="Staging Content Generation"
    DESC="Gera 2 notícias para testes (staging)"
    FREQ="A cada 15 minutos"
  elif [[ "$COMMAND" == *"auto-generate"* ]] || [[ "$COMMAND" == *"cron-direct"* ]]; then
    NAME="Auto-generate Content"
    DESC="Gera notícias, artistas e produções automaticamente"
    FREQ="A cada 15 minutos"
  elif [[ "$COMMAND" == *"health-monitor"* ]]; then
    NAME="Health Monitor"
    DESC="Monitora saúde dos containers e serviços"
    FREQ="A cada 30 minutos"
  elif [[ "$COMMAND" == *"cleanup-cron"* ]]; then
    NAME="Server Cleanup"
    DESC="Limpa logs, imagens Docker e cache antigos automaticamente"
    FREQ="Diariamente às 3h da manhã"
  elif [[ "$COMMAND" == *"ollama"* ]] && [[ "$COMMAND" == *"stop"* ]]; then
    NAME="Ollama Sleep"
    DESC="Para Ollama à meia-noite para economizar recursos"
    FREQ="Diariamente à meia-noite"
  else
    # Pular linhas que não reconhecemos
    continue
  fi

  # Adicionar vírgula se não for o primeiro
  if [ "$FIRST" = false ]; then
    echo "," >> "$OUTPUT_FILE"
  fi
  FIRST=false

  # Adicionar entry JSON (sem vírgula final, será adicionada no próximo loop)
  cat >> "$OUTPUT_FILE" <<EOF
  {
    "name": "$NAME",
    "schedule": "$SCHEDULE",
    "description": "$DESC",
    "frequency": "$FREQ",
    "script": "$COMMAND"
  }
EOF
done

# Fechar array JSON
echo "" >> "$OUTPUT_FILE"
echo "]" >> "$OUTPUT_FILE"

echo "✅ Cron config exportado para: $OUTPUT_FILE"
cat "$OUTPUT_FILE"
