#!/usr/bin/env bash
set -euo pipefail

# Execute um snippet TS/JS dentro do container app de produção.
# Preferir este helper a comandos inline com ssh + docker exec + tsx -e,
# porque ele evita problemas de aspas, heredoc, sandbox e container trocado.

PROD_HOST="${PROD_HOST:-31.97.255.107}"
PROD_USER="${PROD_USER:-root}"
PROD_PORT="${PROD_PORT:-22}"
PROD_KEY="${PROD_KEY:-$HOME/.ssh/id_ed25519}"
PROD_IMAGE="${PROD_IMAGE:-ghcr.io/uchidate/khub:latest}"

SSH_OPTS=(-p "$PROD_PORT" -i "$PROD_KEY" -o BatchMode=yes)
REMOTE="${PROD_USER}@${PROD_HOST}"

container="${PROD_APP_CONTAINER:-}"
if [[ -z "$container" ]]; then
  container="$(
    ssh "${SSH_OPTS[@]}" "$REMOTE" \
      "docker ps --filter ancestor=${PROD_IMAGE} --format '{{.ID}}' | head -n 1"
  )"
fi

if [[ -z "$container" ]]; then
  echo "Nenhum container ativo encontrado para ${PROD_IMAGE}" >&2
  exit 1
fi

if [[ $# -gt 0 ]]; then
  exec ssh "${SSH_OPTS[@]}" "$REMOTE" \
    "docker exec -i ${container} sh -lc 'tsx -'" < "$1"
fi

exec ssh "${SSH_OPTS[@]}" "$REMOTE" \
  "docker exec -i ${container} sh -lc 'tsx -'"
