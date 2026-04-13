# VibeDistro Worker — Production Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Install dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/integrations/package.json ./packages/integrations/
COPY packages/types/package.json ./packages/types/
RUN npm ci --ignore-scripts

# ---- Generate Prisma client ----
FROM deps AS prisma
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/tsconfig.json ./packages/database/
COPY packages/database/src ./packages/database/src
RUN npx -w packages/database prisma generate

# ---- Build ----
FROM prisma AS builder
COPY tsconfig.base.json turbo.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN npx turbo run build --filter=@vibedistro/worker

# ---- Production image ----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 worker

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./

COPY --from=prisma /app/packages/database/prisma ./packages/database/prisma
COPY --from=prisma /app/packages/database/src/generated ./packages/database/src/generated

WORKDIR /app/apps/worker
USER worker

CMD ["node", "dist/main.js"]
