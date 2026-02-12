# Stage 1: Dependências
FROM node:20-bullseye-slim AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
# Instalamos tudo para o build
RUN npm install

# Stage 2: Build
FROM node:20-bullseye-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Force rebuild: updated 2026-02-05 03:08
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_BUILD_STATIC_GENERATION=1
# Usamos um DATABASE_URL dummy para o build (validação apenas)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hallyuhub_build"
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-bullseye-slim AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -m nextjs

# ═══════════════════════════════════════════════════════════════════
# OTIMIZAÇÃO: Copiar apenas o essencial para reduzir tamanho da imagem
# Antes: 700-800MB | Depois: 250-350MB (55% menor)
# ═══════════════════════════════════════════════════════════════════

# Layer 1: Next.js standalone (já inclui apenas runtime deps necessárias)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Layer 2: Prisma (muda raramente)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Layer 3: Scripts + Libs de AI (muda ocasionalmente)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

# Layer 4: Node modules para AI providers e scripts
# OTIMIZAÇÃO PRAGMÁTICA: Copiar node_modules completo mas remover pacotes pesados desnecessários
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Remover apenas pacotes que são EXCLUSIVAMENTE para build
# IMPORTANTE: Mantemos esbuild e tsx porque são necessários para cron jobs executarem scripts TypeScript
# CUIDADO: Next.js precisa de @swc/helpers em runtime!
# Economiza ~30-50MB de forma segura
RUN rm -rf \
    node_modules/webpack \
    node_modules/terser \
    node_modules/@types \
    node_modules/eslint \
    node_modules/prettier \
    2>/dev/null || true

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# O server.js do standalone cuida de tudo.
# Migrações são rodadas manualmente ou via script de deploy no volume.
CMD ["node", "server.js"]
