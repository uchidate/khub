# Stage 1: Dependências
FROM node:20-bullseye-slim AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
# Instalamos tudo para o build
RUN npm install

# Stage 2: Build
FROM node:20-bullseye-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Force rebuild: updated 2026-02-04
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

# Copiamos apenas o necessário do standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# Scripts e libs necessários para geração de dados via IA
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
# node_modules completo para cobrir dependências dos scripts (AI providers etc.)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# NOVO: Healthcheck adicionado
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# O server.js do standalone cuida de tudo.
# Migrações são rodadas manualmente ou via script de deploy no volume.
CMD ["node", "server.js"]
