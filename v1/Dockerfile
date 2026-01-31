# Stage 1: Dependências
FROM node:20-bullseye-slim AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
# Forçamos a instalação exata do prisma 5.22.0
RUN npm install prisma@5.22.0 @prisma/client@5.22.0 && npm install

# Stage 2: Build
FROM node:20-bullseye-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./build.db"
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_BUILD_STATIC_GENERATION=1
RUN npx prisma@5.22.0 generate
RUN npx prisma@5.22.0 db push --skip-generate
RUN npm run build

# Stage 3: Runner
FROM node:20-bullseye-slim AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates libssl1.1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -m nextjs
RUN mkdir -p /home/nextjs/.npm && chown -R nextjs:nodejs /home/nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Usamos o prisma fixo para rodar a migração
CMD ["sh", "-c", "npx prisma@5.22.0 migrate deploy && node server.js"]
