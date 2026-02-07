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

# Garantir que os scripts são executáveis
chmod +x "${PROJECT_DIR}/scripts/auto-generate-content.sh"
chmod +x "${PROJECT_DIR}/scripts/monitor-health.sh"

# Criar diretório de logs
mkdir -p "${PROJECT_DIR}/logs"

# Argumentos
FORCE=false
NO_TEST=false

for arg in "$@"; do
    case $arg in
        -f|--force)
            FORCE=true
            ;;
        --no-test)
            NO_TEST=true
            ;;
    esac
done

# Verificar se já existe entrada no crontab
if crontab -l 2>/dev/null | grep -q "auto-generate-content.sh"; then
    echo "⚠️  Já existe uma entrada no crontab para auto-generate-content.sh"
    echo ""
    echo "Entrada atual:"
    crontab -l 2>/dev/null | grep "auto-generate-content.sh" || true
    echo ""
    
    if [ "$FORCE" = true ]; then
        echo "Forçando substituição..."
    else
        read -p "Deseja substituir? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Mantendo configuração atual."
            exit 0
        fi
    fi
    # Remover entrada antiga
    NEW_CRON=$(crontab -l 2>/dev/null | grep -v "auto-generate-content.sh" || true)
    if [ -n "$NEW_CRON" ]; then
        echo "$NEW_CRON" | crontab -
    else
        crontab -r || true
    fi
fi

# Adicionar nova entrada ao crontab (Conteúdo: a cada 4 horas | Saúde: a cada 30 min)
echo "Adicionando entrada ao crontab..."

(crontab -l 2>/dev/null || echo ""; \
 echo "# HallyuHub - Auto generate content every 4 hours"; \
 echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"; \
 echo "0 */4 * * * ${PROJECT_DIR}/scripts/auto-generate-content.sh >> ${PROJECT_DIR}/logs/cron-direct.log 2>&1"
 echo ""
 echo "# HallyuHub - Health Monitor every 30 minutes"
 echo "*/30 * * * * ${PROJECT_DIR}/scripts/monitor-health.sh >> ${PROJECT_DIR}/logs/health-monitor.log 2>&1"
 echo ""
 echo "# HallyuHub - Auto sleep staging at midnight to save CPU"
 echo "0 0 * * * ${PROJECT_DIR}/scripts/manage-staging.sh sleep >> ${PROJECT_DIR}/logs/staging-management.log 2>&1") | crontab -

chmod +x "${PROJECT_DIR}/scripts/manage-staging.sh"
echo "✅ Crontab configurado com sucesso (Conteúdo + Saúde + Auto-Sleep Staging)!"
echo ""
echo "Configuração atual:"
crontab -l 2>/dev/null | grep -A 2 "HallyuHub" || echo "Aviso: Não foi possível verificar a entrada (grep falhou)"
echo ""

# Testar execução manual
if [ "$NO_TEST" = true ]; then
    echo "Pulo teste de execução (--no-test)."
else
    echo "Deseja testar a execução agora? (y/N) "
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Executando teste..."
        "${PROJECT_DIR}/scripts/auto-generate-content.sh"
    fi
fi

echo ""
echo "=========================================="
echo "  SETUP CONCLUÍDO"
echo "=========================================="
echo "  O script será executado a cada 5 minutos"
echo "  Logs: ${PROJECT_DIR}/logs/auto-generate-*.log"
echo ""
echo "  Comandos úteis:"
echo "    Visualizar crontab:  crontab -l"
echo "    Editar crontab:      crontab -e"
echo "    Remover crontab:     crontab -r"
echo "    Ver logs:            tail -f ${PROJECT_DIR}/logs/auto-generate-*.log"
echo "=========================================="
