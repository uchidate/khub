#!/bin/bash
# Script de Deploy Robusto - HallyuHub
# Este script deve rodar DENTRO do servidor em /var/www/hallyuhub

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
image_name="hallyuhub_proc"
pull_mode=false
env_type="production" # default
compose_file="docker-compose.prod.yml"
service_name="hallyuhub" # default

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --pull) image_name="$2"; pull_mode=true; shift ;;
        --staging) env_type="staging"; compose_file="docker-compose.staging.yml"; service_name="hallyuhub-staging" ;;
        --prod) env_type="production"; compose_file="docker-compose.prod.yml"; service_name="hallyuhub" ;;
    esac
    shift
done

# Carrega variáveis do .env se existir (opcional para segredos locais)
if [ -f "${SCRIPT_DIR}/.env.${env_type}" ]; then
  export $(grep -v '^#' "${SCRIPT_DIR}/.env.${env_type}" | grep '=' | xargs)
fi

echo "🚀 Iniciando deploy em ambiente: ${env_type}..."

# Criar volumes externos se não existirem
echo "📦 Verificando volumes Docker..."
if [ "$env_type" = "production" ]; then
  docker volume create postgres-production-data 2>/dev/null || true
elif [ "$env_type" = "staging" ]; then
  docker volume create postgres-staging-data 2>/dev/null || true
fi
docker volume create hallyuhub-data 2>/dev/null || true

# 0. Backup automático antes de qualquer alteração (Apenas em Prod)
if [ "$env_type" = "production" ]; then
  echo "💾 Criando backup do banco antes do deploy..."
  bash "${SCRIPT_DIR}/scripts/backup-db.sh" --prod --keep 30
fi

# 1. Limpar e puxar
if [ "$pull_mode" = true ]; then
  echo "📥 Baixando imagem remota: $image_name"
  docker pull "$image_name"
fi

# 2. Rodar via Docker Compose específico
echo "🏃 Atualizando serviço via Docker Compose: $compose_file"
docker compose -f "$compose_file" pull

# Rodar migrações antes de subir (usa o volume persistente)
docker compose -f "$compose_file" run --rm "$service_name" npx prisma migrate deploy

docker compose -f "$compose_file" up -d --force-recreate

echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "✅ Deploy concluído em ${env_type}!"
sleep 5
echo "📋 Status do container ${service_name}:"
docker ps -a --filter name="${service_name}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
