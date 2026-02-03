#!/bin/bash
# ============================================================
# Setup Auto Generation - HallyuHub
# ============================================================
# Configura geração automática de conteúdo via cron
# USAR APENAS EM STAGING/PRODUCTION
# ============================================================

set -e

# Verificar se está rodando em ambiente de servidor
if [ -z "$NODE_ENV" ] || [ "$NODE_ENV" = "development" ]; then
    echo "⚠️  AVISO: Este script é para ambientes staging/production"
    echo "Ambiente atual: ${NODE_ENV:-development}"
    read -p "Deseja continuar mesmo assim? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelado."
        exit 0
    fi
fi

# Detectar diretório do projeto
if [ -d "/var/www/hallyuhub" ]; then
    PROJECT_DIR="/var/www/hallyuhub"
else
    PROJECT_DIR="$(pwd)"
fi

echo "=========================================="
echo "  SETUP AUTO GENERATION - HallyuHub"
echo "=========================================="
echo "  Diretório: ${PROJECT_DIR}"
echo "  Ambiente:  ${NODE_ENV:-development}"
echo "=========================================="
echo ""

# Verificar se o script de auto-geração existe
if [ ! -f "${PROJECT_DIR}/scripts/auto-generate-content.sh" ]; then
    echo "❌ Erro: scripts/auto-generate-content.sh não encontrado"
    exit 1
fi

# Garantir que o script é executável
chmod +x "${PROJECT_DIR}/scripts/auto-generate-content.sh"

# Criar diretório de logs
mkdir -p "${PROJECT_DIR}/logs"

# Verificar se já existe entrada no crontab
if crontab -l 2>/dev/null | grep -q "auto-generate-content.sh"; then
    echo "⚠️  Já existe uma entrada no crontab para auto-generate-content.sh"
    echo ""
    echo "Entrada atual:"
    crontab -l | grep "auto-generate-content.sh"
    echo ""
    read -p "Deseja substituir? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Mantendo configuração atual."
        exit 0
    fi
    # Remover entrada antiga
    (crontab -l | grep -v "auto-generate-content.sh") | crontab -
fi

# Adicionar nova entrada ao crontab
echo "Adicionando entrada ao crontab (a cada 15 minutos)..."

(crontab -l 2>/dev/null || echo ""; \
 echo "# HallyuHub - Auto generate content every 15 minutes"; \
 echo "*/15 * * * * ${PROJECT_DIR}/scripts/auto-generate-content.sh") | crontab -

echo "✅ Crontab configurado com sucesso!"
echo ""
echo "Configuração atual:"
crontab -l | grep -A 1 "HallyuHub"
echo ""

# Testar execução manual
echo "Deseja testar a execução agora? (y/N) "
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Executando teste..."
    "${PROJECT_DIR}/scripts/auto-generate-content.sh"
fi

echo ""
echo "=========================================="
echo "  SETUP CONCLUÍDO"
echo "=========================================="
echo "  O script será executado a cada 15 minutos"
echo "  Logs: ${PROJECT_DIR}/logs/auto-generate-*.log"
echo ""
echo "  Comandos úteis:"
echo "    Visualizar crontab:  crontab -l"
echo "    Editar crontab:      crontab -e"
echo "    Remover crontab:     crontab -r"
echo "    Ver logs:            tail -f ${PROJECT_DIR}/logs/auto-generate-*.log"
echo "=========================================="
