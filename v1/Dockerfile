# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-bullseye-slim AS deps

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-bullseye-slim AS builder

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-bullseye-slim AS runner

RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

# NOVO: Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
