# syntax=docker/dockerfile:1.4
# ═══════════════════════════════════════════════════════════════════
# DOCKERFILE OTIMIZADO - Reduz build time em ~40-60%
# ═══════════════════════════════════════════════════════════════════
# Mudanças principais:
# - Prisma generate roda UMA vez (não duas)
# - Cache de layers mais eficiente (ordem otimizada)
# - BuildKit cache mount para .next/cache (maior ganho: ~3-5min)
# - BuildKit cache mount para npm (evita re-download de pacotes)
# ═══════════════════════════════════════════════════════════════════

# Stage 1: Dependências (com cache eficiente)
FROM node:20-bullseye-slim AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# OTIMIZAÇÃO: Copiar package files primeiro para cache de layers
COPY package.json package-lock.json ./

# NODE_ENV=development garante que devDependencies (tailwindcss, etc.) sejam
# instaladas mesmo que o CI/Coolify passe NODE_ENV=production como build arg
ENV NODE_ENV=development

# Cache mount para ~/.npm evita re-download de pacotes entre builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --legacy-peer-deps

# Copiar prisma para geração do client
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY prisma-kpopping ./prisma-kpopping/

# OTIMIZAÇÃO: Prisma generate UMA vez (deps stage)
# Antes gerava 2x: deps + builder
RUN npx prisma generate && \
    npx prisma generate --schema=prisma-kpopping/schema.prisma --config=prisma-kpopping/prisma.config.ts

# Stage 2: Production deps (apenas runtime)
FROM node:20-bullseye-slim AS deps-production
WORKDIR /app

# Copiar deps completo e fazer prune
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json

# Remover dev dependencies (economiza ~200-300MB)
RUN npm prune --production --legacy-peer-deps

# Stage 3: Builder
FROM node:20-bullseye-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# OTIMIZAÇÃO: Copiar node_modules completo (com dev deps para build)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copiar código fonte
COPY . .

# NODE_ENV=production para o next build:
# - React production mode: key prop warnings não viram erros fatais
# - node_modules já tem devDeps (copiado do stage deps com NODE_ENV=development)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_BUILD_STATIC_GENERATION=1
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hallyuhub_build"

# Variáveis públicas (NEXT_PUBLIC_*) são embutidas no bundle durante o build.
# Precisam ser declaradas como ARG + ENV para o next build ter acesso.
ARG NEXT_PUBLIC_ADSENSE_CLIENT
ARG NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP
ARG NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD
ARG NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE
ARG NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX
ARG NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_1
ARG NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_2
ARG NEXT_PUBLIC_ADSENSE_SLOT_BANNER
ENV NEXT_PUBLIC_ADSENSE_CLIENT=$NEXT_PUBLIC_ADSENSE_CLIENT
ENV NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP=$NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP
ENV NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD=$NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD
ENV NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE=$NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE
ENV NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX=$NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX
ENV NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_1=$NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_1
ENV NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_2=$NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_2
ENV NEXT_PUBLIC_ADSENSE_SLOT_BANNER=$NEXT_PUBLIC_ADSENSE_SLOT_BANNER

# OTIMIZAÇÃO: Prisma já foi gerado no stage deps, não rodar novamente
# RUN npx prisma generate  <-- REMOVIDO (economiza 10-20s)

# Cache mount para .next/cache: o Next.js reusa chunks compilados entre builds.
# Resultado: builds subsequentes ~3-5 min mais rápidos (apenas módulos alterados recompilam).
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Stage 4: Runner (produção)
FROM node:20-bullseye-slim AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -m nextjs

# OTIMIZAÇÃO: Copiar APENAS node_modules de produção (deps-production stage)
# Economiza ~200-300MB e acelera push/pull do registry
COPY --from=deps-production --chown=nextjs:nodejs /app/node_modules ./node_modules


# Next.js standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma (já gerado no deps stage)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/prisma-kpopping ./prisma-kpopping

# Scripts + Libs de AI + Entrypoint
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
RUN chmod +x ./scripts/docker-entrypoint.sh
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck otimizado (30s → 20s interval)
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["./scripts/docker-entrypoint.sh"]
