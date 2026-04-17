#!/usr/bin/env bash
set -euo pipefail

# Promote blog blocks from local DB to staging + production DBs in Coolify.
#
# Usage:
#   bash scripts/promote-blog-post.sh --id cmn4rp1d30000u3n2wx9b6pd4
#   bash scripts/promote-blog-post.sh --slug blackpink-comeback-2026-o-que-esperar
#
# Optional:
#   --host 31.97.255.107

HOST="31.97.255.107"
POST_ID=""
POST_SLUG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="$2"
      shift 2
      ;;
    --id)
      POST_ID="$2"
      shift 2
      ;;
    --slug)
      POST_SLUG="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$POST_ID" && -z "$POST_SLUG" ]]; then
  echo "Use --id or --slug"
  exit 1
fi

TMP_JSON="/tmp/blog-post-blocks-$$.json"
trap 'rm -f "$TMP_JSON"' EXIT

if [[ -n "$POST_ID" ]]; then
  TARGET_MODE="id"
  TARGET_VALUE="$POST_ID"
else
  TARGET_MODE="slug"
  TARGET_VALUE="$POST_SLUG"
fi

echo "[1/6] Exporting blocks from local database..."
TARGET_MODE="$TARGET_MODE" TARGET_VALUE="$TARGET_VALUE" npx tsx <<'TS' > "$TMP_JSON"
import 'dotenv/config'
import prismaImport from './lib/prisma'

const prisma = (prismaImport as any).default ?? prismaImport

const mode = process.env.TARGET_MODE
const value = process.env.TARGET_VALUE

async function main() {
  const where = mode === 'id' ? { id: value } : { slug: value }
  const post = await prisma.blogPost.findUnique({ where, select: { id: true, slug: true, blocks: true } })

  if (!post) {
    throw new Error(`Post not found for ${mode}=${value}`)
  }

  if (!Array.isArray(post.blocks)) {
    throw new Error('Post blocks are not an array')
  }

  process.stderr.write(`Post: ${post.slug} (${post.id})\n`)
  process.stderr.write(`Blocks: ${post.blocks.length}\n`)
  process.stdout.write(JSON.stringify(post.blocks))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
TS

EXPECTED_BLOCKS=$(node -e "const fs=require('fs'); console.log(JSON.parse(fs.readFileSync(process.argv[1],'utf8')).length)" "$TMP_JSON")
echo "Expected blocks: $EXPECTED_BLOCKS"

echo "[2/6] Discovering remote containers..."
DISCOVERED_RAW=$(ssh root@"$HOST" '
  set -e
  for ENV in staging production; do
    DB_CONTAINER=$(docker ps -q --filter "label=coolify.type=database" --filter "label=coolify.environmentName=${ENV}" | head -n1)
    APP_CONTAINER=$(docker ps --format "{{.Names}}" | while read -r c; do
      e=$(docker inspect "$c" --format "{{ index .Config.Labels \"coolify.type\" }}|{{ index .Config.Labels \"coolify.environmentName\" }}|{{.Config.Image}}" 2>/dev/null || true)
      echo "$c|$e"
    done | grep "|application|${ENV}|ghcr.io/uchidate/khub:" | head -n1 | cut -d"|" -f1)

    if [[ -z "$DB_CONTAINER" || -z "$APP_CONTAINER" ]]; then
      echo "ERR|${ENV}|missing_container"
      continue
    fi

    DB_URL=$(docker inspect "$APP_CONTAINER" --format "{{range .Config.Env}}{{println .}}{{end}}" | grep "^DATABASE_URL=" | cut -d= -f2-)
    DB_NAME=$(echo "$DB_URL" | sed -E "s#.*://[^/]+/([^?]+).*#\1#")

    echo "OK|${ENV}|${DB_CONTAINER}|${DB_NAME}"
  done
 ')

DISCOVERED=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  DISCOVERED+=("$line")
done <<EOF
$DISCOVERED_RAW
EOF

for row in "${DISCOVERED[@]}"; do
  if [[ "$row" == ERR* ]]; then
    echo "Failed discovery: $row"
    exit 1
  fi
done

echo "[3/6] Uploading payload to server..."
scp -q "$TMP_JSON" root@"$HOST":"$TMP_JSON"

echo "[4/6] Updating staging and production..."
for row in "${DISCOVERED[@]}"; do
  IFS='|' read -r _ ENV DB_CONTAINER DB_NAME <<< "$row"
  echo "Updating ${ENV} (${DB_CONTAINER}, db=${DB_NAME})"
  ssh root@"$HOST" "docker cp '$TMP_JSON' '${DB_CONTAINER}:/tmp/blog-post-blocks.json' && docker exec '${DB_CONTAINER}' psql -U postgres -d '${DB_NAME}' -v ON_ERROR_STOP=1 -c \"UPDATE \\\"BlogPost\\\" SET blocks = pg_read_file('/tmp/blog-post-blocks.json')::jsonb, \\\"updatedAt\\\" = NOW() WHERE ${TARGET_MODE} = '${TARGET_VALUE}';\""
done

echo "[5/6] Validating final state..."
for row in "${DISCOVERED[@]}"; do
  IFS='|' read -r _ ENV DB_CONTAINER DB_NAME <<< "$row"
  ACTUAL=$(ssh root@"$HOST" "docker exec '${DB_CONTAINER}' psql -U hallyuhub -d '${DB_NAME}' -tAc \"SELECT jsonb_array_length(blocks) FROM \\\"BlogPost\\\" WHERE ${TARGET_MODE} = '${TARGET_VALUE}';\"" | tr -d '[:space:]')
  if [[ "$ACTUAL" != "$EXPECTED_BLOCKS" ]]; then
    echo "Validation failed in ${ENV}: expected ${EXPECTED_BLOCKS}, got ${ACTUAL:-<empty>}"
    exit 1
  fi
  echo "${ENV}: OK (${ACTUAL} blocks)"
done

echo "[6/6] Cleanup..."
ssh root@"$HOST" "rm -f '$TMP_JSON'"

echo "Done. Post synchronized to staging and production."
